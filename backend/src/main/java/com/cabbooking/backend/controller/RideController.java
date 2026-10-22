package com.cabbooking.backend.controller;

import com.cabbooking.backend.dto.CancelRideRequest;
import com.cabbooking.backend.dto.FareEstimateResponse;
import com.cabbooking.backend.dto.RideRequest;
import com.cabbooking.backend.entity.Ride;
import com.cabbooking.backend.service.RideService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rides")
public class RideController {

    private final RideService rideService;

    public RideController(RideService rideService) {
        this.rideService = rideService;
    }

    @PostMapping("/book")
    public ResponseEntity<Ride> bookRide(
            @RequestBody RideRequest request,
            Authentication authentication) {

        Ride ride;
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            ride = rideService.bookRide(authentication.getName(), request);
        } else if (request.getRiderId() != null) {
            ride = rideService.bookRide(
                    request.getRiderId(),
                    request.getPickupLocation(),
                    request.getDropLocation(),
                    request.getDistanceKm()
            );
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(ride);
    }

    @PutMapping("/{rideId}/accept")
    public ResponseEntity<Ride> acceptRide(
            @PathVariable Long rideId,
            @RequestParam(required = false) Long driverId,
            Authentication authentication) {

        Ride ride;
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            ride = rideService.acceptRide(rideId, authentication.getName());
        } else if (driverId != null) {
            ride = rideService.acceptRide(rideId, driverId);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(ride);
    }

    @PutMapping("/{rideId}/start")
    public ResponseEntity<Ride> startRide(
            @PathVariable Long rideId,
            @RequestParam(required = false) Long driverId,
            Authentication authentication) {

        Ride ride;
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            ride = rideService.startRide(rideId, authentication.getName());
        } else if (driverId != null) {
            ride = rideService.startRide(rideId, driverId);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(ride);
    }

    @PutMapping("/{rideId}/complete")
    public ResponseEntity<Ride> completeRide(
            @PathVariable Long rideId,
            @RequestParam(required = false) Long driverId,
            Authentication authentication) {

        Ride ride;
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            ride = rideService.completeRide(rideId, authentication.getName());
        } else if (driverId != null) {
            ride = rideService.completeRide(rideId, driverId);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(ride);
    }

    @PutMapping("/{rideId}/cancel")
    public ResponseEntity<Ride> cancelRide(
            @PathVariable Long rideId,
            @RequestParam(required = false) Long riderId,
            @RequestBody(required = false) CancelRideRequest cancelRequest,
            Authentication authentication) {

        String reason = cancelRequest != null ? cancelRequest.getReason() : null;
        Ride cancelledRide;
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            cancelledRide = rideService.cancelRide(rideId, authentication.getName(), reason);
        } else if (riderId != null) {
            cancelledRide = rideService.cancelRide(rideId, riderId);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(cancelledRide);
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveRide(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getName();
        // Check rider active ride first
        var riderRide = rideService.getActiveRideForRider(email);
        if (riderRide.isPresent()) {
            return ResponseEntity.ok(riderRide.get());
        }

        // If not found, check driver active ride
        try {
            var driverRide = rideService.getActiveRideForDriver(email);
            if (driverRide.isPresent()) {
                return ResponseEntity.ok(driverRide.get());
            }
        } catch (Exception ignored) {
            // Not a driver, ignore
        }

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/active/rider")
    public ResponseEntity<Ride> getActiveRideForRider(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return rideService.getActiveRideForRider(authentication.getName())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/active/driver")
    public ResponseEntity<Ride> getActiveRideForDriver(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return rideService.getActiveRideForDriver(authentication.getName())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/estimate")
    public ResponseEntity<List<FareEstimateResponse>> getFareEstimates(
            @RequestParam double distanceKm,
            @RequestParam(required = false) Integer durationMinutes) {

        List<FareEstimateResponse> estimates = rideService.getAllFareEstimates(distanceKm, durationMinutes);
        return ResponseEntity.ok(estimates);
    }

    @GetMapping("/history/{riderId}")
    public ResponseEntity<List<Ride>> getRideHistory(@PathVariable Long riderId) {
        List<Ride> rides = rideService.getRideHistory(riderId);
        return ResponseEntity.ok(rides);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Ride>> getMyRideHistory(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<Ride> rides = rideService.getRideHistoryByEmail(authentication.getName());
        return ResponseEntity.ok(rides);
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<Ride>> getDriverRideHistory(@PathVariable Long driverId) {
        List<Ride> rides = rideService.getDriverRideHistory(driverId);
        return ResponseEntity.ok(rides);
    }

    @GetMapping("/driver/my-rides")
    public ResponseEntity<List<Ride>> getMyDriverRides(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<Ride> rides = rideService.getDriverRideHistoryByEmail(authentication.getName());
        return ResponseEntity.ok(rides);
    }

    @GetMapping("/available")
    public ResponseEntity<List<Ride>> getAvailableRides() {
        List<Ride> rides = rideService.getAvailableRides();
        return ResponseEntity.ok(rides);
    }

    @GetMapping("/{rideId}")
    public ResponseEntity<Ride> getRideById(@PathVariable Long rideId) {
        Ride ride = rideService.getRideById(rideId);
        return ResponseEntity.ok(ride);
    }
}