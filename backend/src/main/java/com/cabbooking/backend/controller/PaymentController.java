package com.cabbooking.backend.controller;

import com.cabbooking.backend.entity.Payment;
import com.cabbooking.backend.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create-order/{rideId}")
    public ResponseEntity<?> createOrder(
            @PathVariable Long rideId) {

        try {
            Payment payment = paymentService.createOrder(rideId);

            return ResponseEntity.ok(Map.of(
                    "paymentId", payment.getId(),
                    "rideId", payment.getRide().getId(),
                    "amount", payment.getAmount(),
                    "currency", "INR",
                    "status", payment.getStatus(),
                    "razorpayOrderId", payment.getRazorpayOrderId()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}