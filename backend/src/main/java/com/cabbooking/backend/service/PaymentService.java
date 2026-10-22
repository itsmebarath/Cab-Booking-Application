
package com.cabbooking.backend.service;

import com.cabbooking.backend.entity.Payment;
import com.cabbooking.backend.entity.PaymentStatus;
import com.cabbooking.backend.entity.Ride;
import com.cabbooking.backend.repository.PaymentRepository;
import com.cabbooking.backend.repository.RideRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RideRepository rideRepository;
    private final RazorpayClient razorpayClient;

    public PaymentService(
            PaymentRepository paymentRepository,
            RideRepository rideRepository,
            @Value("${razorpay.key.id}") String keyId,
            @Value("${razorpay.key.secret}") String keySecret
    ) throws Exception {

        this.paymentRepository = paymentRepository;
        this.rideRepository = rideRepository;
        this.razorpayClient = new RazorpayClient(keyId, keySecret);
    }

    @Transactional
    public Payment createOrder(Long rideId) throws Exception {

        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() ->
                        new RuntimeException("Ride not found"));

        if (ride.getFare() == null ||
                ride.getFare().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Invalid ride fare");
        }

        if (paymentRepository.findByRideId(rideId).isPresent()) {
            throw new RuntimeException(
                    "A payment record already exists for this ride");
        }

        // Razorpay accepts the amount in paise.
        int amountInPaise = ride.getFare()
                .multiply(BigDecimal.valueOf(100))
                .intValueExact();

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaise);
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "ride_" + rideId);

        Order order = razorpayClient.orders.create(orderRequest);

        Payment payment = new Payment();
        payment.setRide(ride);
        payment.setAmount(ride.getFare());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setRazorpayOrderId(order.get("id"));

        return paymentRepository.save(payment);
    }
}