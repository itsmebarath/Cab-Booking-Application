package com.cabbooking.backend;

import com.cabbooking.backend.dto.FareEstimateResponse;
import com.cabbooking.backend.dto.RideRequest;
import com.cabbooking.backend.entity.*;
import com.cabbooking.backend.repository.DriverRepository;
import com.cabbooking.backend.repository.RideRepository;
import com.cabbooking.backend.repository.UserRepository;
import com.cabbooking.backend.service.RideNotificationService;
import com.cabbooking.backend.service.RideService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RideLifecycleTest {

    @Mock
    private RideRepository rideRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DriverRepository driverRepository;

    @Mock
    private RideNotificationService rideNotificationService;

    @InjectMocks
    private RideService rideService;

    private User riderUser;
    private User driverUser;
    private Driver driverEntity;
    private Ride requestedRide;

    @BeforeEach
    void setUp() {
        riderUser = User.builder()
                .id(1L)
                .name("Alice Rider")
                .email("alice@example.com")
                .password("encoded_pass")
                .phone("9876543210")
                .role(Role.RIDER)
                .createdAt(LocalDateTime.now())
                .build();

        driverUser = User.builder()
                .id(2L)
                .name("Bob Driver")
                .email("bob@example.com")
                .password("encoded_pass")
                .phone("9876543211")
                .role(Role.DRIVER)
                .createdAt(LocalDateTime.now())
                .build();

        driverEntity = Driver.builder()
                .id(10L)
                .user(driverUser)
                .licenseNumber("DL999888")
                .vehicleNumber("TN01AA1111")
                .vehicleModel("Hyundai Verna")
                .vehicleCategory(VehicleCategory.SEDAN)
                .available(true)
                .build();

        requestedRide = Ride.builder()
                .id(100L)
                .rider(riderUser)
                .pickupLocation("Central Station")
                .dropLocation("Airport Terminal 2")
                .distanceKm(15.0)
                .estimatedDurationMinutes(30)
                .vehicleCategory(VehicleCategory.SEDAN)
                .fare(new BigDecimal("335.00"))
                .status(RideStatus.REQUESTED)
                .bookedAt(LocalDateTime.now().minusMinutes(5))
                .build();
    }

    @Test
    @DisplayName("Fare Engine: Correct fare calculation across BIKE, AUTO, SEDAN, and SUV")
    void testCalculateFareMultiCategory() {
        // BIKE: Base 25, 8/km, 1/min (Min 30). For 10 km, 15 min -> 25 + 80 + 15 = 120.00
        BigDecimal bikeFare = rideService.calculateFare(10.0, 15, VehicleCategory.BIKE);
        assertEquals(new BigDecimal("120.00"), bikeFare);

        // AUTO: Base 35, 11/km, 1.5/min (Min 40). For 5 km, 10 min -> 35 + 55 + 15 = 105.00
        BigDecimal autoFare = rideService.calculateFare(5.0, 10, VehicleCategory.AUTO);
        assertEquals(new BigDecimal("105.00"), autoFare);

        // SEDAN: Base 50, 15/km, 2/min (Min 60). For 10 km, 20 min -> 50 + 150 + 40 = 240.00
        BigDecimal sedanFare = rideService.calculateFare(10.0, 20, VehicleCategory.SEDAN);
        assertEquals(new BigDecimal("240.00"), sedanFare);

        // SUV: Base 80, 20/km, 2.5/min (Min 100). For 10 km, 20 min -> 80 + 200 + 50 = 330.00
        BigDecimal suvFare = rideService.calculateFare(10.0, 20, VehicleCategory.SUV);
        assertEquals(new BigDecimal("330.00"), suvFare);

        // Minimum fare enforcement: BIKE for 0.2 km, 0 min -> 25 + 1.6 = 26.60 < Min 30 -> 30.00
        BigDecimal minBikeFare = rideService.calculateFare(0.2, 0, VehicleCategory.BIKE);
        assertEquals(new BigDecimal("30.00"), minBikeFare);

        // Invalid distance validation
        assertThrows(IllegalArgumentException.class, () -> rideService.calculateFare(0.0, 10, VehicleCategory.SEDAN));
        assertThrows(IllegalArgumentException.class, () -> rideService.calculateFare(-5.0, 10, VehicleCategory.SEDAN));
    }

    @Test
    @DisplayName("Fare Engine: Estimate endpoint returns all 4 categories")
    void testGetAllFareEstimates() {
        List<FareEstimateResponse> estimates = rideService.getAllFareEstimates(10.0, 20);
        assertEquals(4, estimates.size());
        assertTrue(estimates.stream().anyMatch(e -> e.getCategory() == VehicleCategory.BIKE));
        assertTrue(estimates.stream().anyMatch(e -> e.getCategory() == VehicleCategory.AUTO));
        assertTrue(estimates.stream().anyMatch(e -> e.getCategory() == VehicleCategory.SEDAN));
        assertTrue(estimates.stream().anyMatch(e -> e.getCategory() == VehicleCategory.SUV));
    }

    @Test
    @DisplayName("Lifecycle: Rider books a ride successfully")
    void testBookRideSuccess() {
        RideRequest request = new RideRequest();
        request.setPickupLocation("MG Road");
        request.setDropLocation("Tech Park");
        request.setDistanceKm(12.0);
        request.setEstimatedDurationMinutes(25);
        request.setVehicleCategory("SEDAN");

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(riderUser));
        when(rideRepository.findByRiderIdAndStatusIn(eq(1L), any())).thenReturn(Collections.emptyList());
        when(rideRepository.save(any(Ride.class))).thenAnswer(invocation -> {
            Ride r = invocation.getArgument(0);
            r.setId(101L);
            return r;
        });

        Ride booked = rideService.bookRide("alice@example.com", request);

        assertNotNull(booked);
        assertEquals(101L, booked.getId());
        assertEquals(RideStatus.REQUESTED, booked.getStatus());
        assertEquals(VehicleCategory.SEDAN, booked.getVehicleCategory());
        assertEquals("MG Road", booked.getPickupLocation());
        verify(rideNotificationService, times(1)).sendRideStatusUpdate(eq(101L), eq("REQUESTED"), anyString());
    }

    @Test
    @DisplayName("Lifecycle: Rider booking rejected with 409 Conflict if active ride exists")
    void testBookRideConflictActiveRide() {
        RideRequest request = new RideRequest();
        request.setPickupLocation("MG Road");
        request.setDropLocation("Tech Park");
        request.setDistanceKm(12.0);

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(riderUser));
        when(rideRepository.findByRiderIdAndStatusIn(eq(1L), any())).thenReturn(List.of(requestedRide));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> rideService.bookRide("alice@example.com", request));

        assertEquals(409, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("active ride"));
        verify(rideRepository, never()).save(any());
    }

    @Test
    @DisplayName("Lifecycle: Driver accepts ride with pessimistic row lock")
    void testAcceptRideSuccess() {
        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(driverUser));
        when(driverRepository.findByUserId(2L)).thenReturn(Optional.of(driverEntity));
        when(rideRepository.findByDriverIdAndStatusIn(eq(10L), any())).thenReturn(Collections.emptyList());
        when(rideRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(requestedRide));
        when(rideRepository.save(any(Ride.class))).thenAnswer(inv -> inv.getArgument(0));

        Ride accepted = rideService.acceptRide(100L, "bob@example.com");

        assertNotNull(accepted);
        assertEquals(RideStatus.ACCEPTED, accepted.getStatus());
        assertEquals(driverEntity, accepted.getDriver());
        assertFalse(driverEntity.isAvailable(), "Driver should be marked unavailable after acceptance");
        verify(driverRepository, times(1)).save(driverEntity);
        verify(rideNotificationService, times(1)).sendRideStatusUpdate(eq(100L), eq("ACCEPTED"), anyString());
    }

    @Test
    @DisplayName("Concurrency: Second driver accepting already-accepted ride gets 409 Conflict")
    void testAcceptRideRaceConditionConflict() {
        requestedRide.setStatus(RideStatus.ACCEPTED);
        requestedRide.setDriver(driverEntity);

        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(driverUser));
        when(driverRepository.findByUserId(2L)).thenReturn(Optional.of(driverEntity));
        when(rideRepository.findByDriverIdAndStatusIn(eq(10L), any())).thenReturn(Collections.emptyList());
        when(rideRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(requestedRide));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> rideService.acceptRide(100L, "bob@example.com"));

        assertEquals(409, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("no longer available"));
        verify(rideRepository, never()).save(any());
    }

    @Test
    @DisplayName("Lifecycle: Unavailable driver cannot accept ride")
    void testAcceptRideDriverUnavailable() {
        driverEntity.setAvailable(false);

        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(driverUser));
        when(driverRepository.findByUserId(2L)).thenReturn(Optional.of(driverEntity));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> rideService.acceptRide(100L, "bob@example.com"));

        assertEquals(400, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("not available"));
    }

    @Test
    @DisplayName("Lifecycle: Driver starts accepted ride")
    void testStartRideSuccess() {
        requestedRide.setStatus(RideStatus.ACCEPTED);
        requestedRide.setDriver(driverEntity);

        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(driverUser));
        when(driverRepository.findByUserId(2L)).thenReturn(Optional.of(driverEntity));
        when(rideRepository.findById(100L)).thenReturn(Optional.of(requestedRide));
        when(rideRepository.save(any(Ride.class))).thenAnswer(inv -> inv.getArgument(0));

        Ride started = rideService.startRide(100L, "bob@example.com");

        assertEquals(RideStatus.IN_PROGRESS, started.getStatus());
        assertNotNull(started.getStartedAt());
        verify(rideNotificationService, times(1)).sendRideStatusUpdate(eq(100L), eq("IN_PROGRESS"), anyString());
    }

    @Test
    @DisplayName("Lifecycle: Unassigned driver cannot start ride")
    void testStartRideForbiddenForOtherDriver() {
        requestedRide.setStatus(RideStatus.ACCEPTED);
        Driver anotherDriver = Driver.builder().id(99L).build();
        requestedRide.setDriver(anotherDriver);

        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(driverUser));
        when(driverRepository.findByUserId(2L)).thenReturn(Optional.of(driverEntity));
        when(rideRepository.findById(100L)).thenReturn(Optional.of(requestedRide));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> rideService.startRide(100L, "bob@example.com"));

        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    @DisplayName("Lifecycle: Driver completes in-progress ride and becomes available")
    void testCompleteRideSuccess() {
        requestedRide.setStatus(RideStatus.IN_PROGRESS);
        requestedRide.setDriver(driverEntity);
        driverEntity.setAvailable(false);

        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(driverUser));
        when(driverRepository.findByUserId(2L)).thenReturn(Optional.of(driverEntity));
        when(rideRepository.findById(100L)).thenReturn(Optional.of(requestedRide));
        when(rideRepository.save(any(Ride.class))).thenAnswer(inv -> inv.getArgument(0));

        Ride completed = rideService.completeRide(100L, "bob@example.com");

        assertEquals(RideStatus.COMPLETED, completed.getStatus());
        assertNotNull(completed.getCompletedAt());
        assertTrue(driverEntity.isAvailable(), "Driver must be marked available upon completion");
        verify(driverRepository, times(1)).save(driverEntity);
        verify(rideNotificationService, times(1)).sendRideStatusUpdate(eq(100L), eq("COMPLETED"), anyString());
    }

    @Test
    @DisplayName("Lifecycle: Rider cancels requested ride with reason")
    void testCancelRideByRider() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(riderUser));
        when(rideRepository.findById(100L)).thenReturn(Optional.of(requestedRide));
        when(rideRepository.save(any(Ride.class))).thenAnswer(inv -> inv.getArgument(0));

        Ride cancelled = rideService.cancelRide(100L, "alice@example.com", "Changed my mind");

        assertEquals(RideStatus.CANCELLED, cancelled.getStatus());
        assertEquals("Changed my mind", cancelled.getCancellationReason());
        assertNotNull(cancelled.getCancelledAt());
        verify(rideNotificationService, times(1)).sendRideStatusUpdate(eq(100L), eq("CANCELLED"), anyString());
    }

    @Test
    @DisplayName("Lifecycle: Cancelling in-progress ride is rejected with 400 Bad Request")
    void testCancelRideInProgressRejected() {
        requestedRide.setStatus(RideStatus.IN_PROGRESS);
        requestedRide.setDriver(driverEntity);

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(riderUser));
        when(rideRepository.findById(100L)).thenReturn(Optional.of(requestedRide));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> rideService.cancelRide(100L, "alice@example.com", "Too late"));

        assertEquals(400, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("Only requested or accepted rides can be cancelled"));
    }

    @Test
    @DisplayName("Lifecycle: Unauthorized user cannot cancel another user's ride")
    void testCancelRideForbidden() {
        User thirdParty = User.builder().id(999L).email("stranger@example.com").role(Role.RIDER).build();

        when(userRepository.findByEmail("stranger@example.com")).thenReturn(Optional.of(thirdParty));
        when(rideRepository.findById(100L)).thenReturn(Optional.of(requestedRide));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> rideService.cancelRide(100L, "stranger@example.com", "Malicious cancel"));

        assertEquals(403, ex.getStatusCode().value());
    }
}
