package com.cabbooking.backend.controller;

import com.cabbooking.backend.dto.AvailabilityRequest;
import com.cabbooking.backend.dto.DriverProfileResponse;
import com.cabbooking.backend.dto.DriverRequest;
import com.cabbooking.backend.dto.LocationUpdateRequest;
import com.cabbooking.backend.dto.NearbyDriverResponse;
import com.cabbooking.backend.entity.Driver;
import com.cabbooking.backend.entity.VehicleCategory;
import com.cabbooking.backend.service.DriverService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    private final DriverService driverService;

    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }

    // 1. Register a new driver profile
    @PostMapping("/register")
    public ResponseEntity<Driver> registerDriver(
            @RequestBody DriverRequest request) {

        Driver driver = driverService.registerDriver(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(driver);
    }

    // 2. Update driver availability
    @PutMapping("/availability")
    public ResponseEntity<?> updateMyAvailability(
            @RequestBody AvailabilityRequest request,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Driver driver = driverService.updateAvailability(authentication.getName(), request.isAvailable());
        return ResponseEntity.ok(driver);
    }

    // Legacy availability endpoint with driverId in path
    @PutMapping("/{driverId}/availability")
    public ResponseEntity<Driver> updateAvailability(
            @PathVariable Long driverId,
            @RequestBody AvailabilityRequest request) {

        Driver driver = driverService.updateAvailability(driverId, request.isAvailable());
        return ResponseEntity.ok(driver);
    }

    // 3. Update driver live GPS location
    @PutMapping("/location")
    public ResponseEntity<DriverProfileResponse> updateLocation(
            @RequestBody LocationUpdateRequest request,
            @RequestParam(required = false) Long driverId,
            Authentication authentication) {

        DriverProfileResponse response;
        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal())) {
            response = driverService.updateLocation(authentication.getName(), request);
        } else if (driverId != null) {
            response = driverService.updateLocation(driverId, request);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(response);
    }

    // 4. Find nearby available drivers for the rider map
    @GetMapping("/nearby")
    public ResponseEntity<List<NearbyDriverResponse>> getNearbyDrivers(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) Integer limit) {

        VehicleCategory vehicleCategory = null;
        if (category != null && !category.isBlank()) {
            try {
                vehicleCategory = VehicleCategory.valueOf(category.toUpperCase().trim());
            } catch (IllegalArgumentException ignored) {}
        }

        List<NearbyDriverResponse> nearby = driverService.getNearbyDrivers(
                latitude,
                longitude,
                vehicleCategory,
                radiusKm,
                limit
        );

        return ResponseEntity.ok(nearby);
    }

    // 5. Get all available drivers
    @GetMapping("/available")
    public ResponseEntity<List<Driver>> getAvailableDrivers() {
        List<Driver> drivers = driverService.getAvailableDrivers();
        return ResponseEntity.ok(drivers);
    }

    // 6. Get profile for authenticated driver
    @GetMapping("/my-profile")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equalsIgnoreCase(String.valueOf(authentication.getPrincipal()))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required"));
        }

        try {
            String email = authentication.getName();
            DriverProfileResponse profile = driverService.getMyProfile(email);
            return ResponseEntity.ok(profile);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("message", e.getReason() != null ? e.getReason() : e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Error loading profile"));
        }
    }
}