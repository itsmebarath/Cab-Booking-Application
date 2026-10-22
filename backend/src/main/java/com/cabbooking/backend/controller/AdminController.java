package com.cabbooking.backend.controller;

import com.cabbooking.backend.entity.Ride;
import com.cabbooking.backend.entity.RideStatus;
import com.cabbooking.backend.entity.User;
import com.cabbooking.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.cabbooking.backend.repository.RideRepository;
import com.cabbooking.backend.entity.Driver;
import com.cabbooking.backend.repository.DriverRepository;
import java.util.Map;
import java.util.HashMap;
import java.util.List;



@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final RideRepository rideRepository;
    private final DriverRepository driverRepository;

   public AdminController(
        UserRepository userRepository,
        RideRepository rideRepository,
        DriverRepository driverRepository) {

    this.userRepository = userRepository;
    this.rideRepository = rideRepository;
    this.driverRepository = driverRepository;
}

    // Get all users
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/rides")
    public ResponseEntity<List<Ride>> getAllRides() {
        return ResponseEntity.ok(rideRepository.findAll());
    }
    @GetMapping("/drivers")
public ResponseEntity<List<Driver>> getAllDrivers() {
    return ResponseEntity.ok(driverRepository.findAll());
}
@GetMapping("/stats")
public ResponseEntity<Map<String, Long>> getDashboardStats() {

    long totalUsers = userRepository.count();
    long totalDrivers = driverRepository.count();
    long totalRides = rideRepository.count();

    long completedRides =
            rideRepository.countByStatus(RideStatus.COMPLETED);

    long pendingRides =
            rideRepository.countByStatus(RideStatus.REQUESTED);

    long cancelledRides =
            rideRepository.countByStatus(RideStatus.CANCELLED);

    Map<String, Long> stats = new HashMap<>();

    stats.put("totalUsers", totalUsers);
    stats.put("totalDrivers", totalDrivers);
    stats.put("totalRides", totalRides);
    stats.put("completedRides", completedRides);
    stats.put("pendingRides", pendingRides);
    stats.put("cancelledRides", cancelledRides);

    return ResponseEntity.ok(stats);
}
@DeleteMapping("/users/{userId}")
public ResponseEntity<String> deleteUser(@PathVariable Long userId) {

    if (!userRepository.existsById(userId)) {
        return ResponseEntity.status(404)
                .body("User not found");
    }

    if (driverRepository.existsByUserId(userId)) {
        return ResponseEntity.badRequest()
                .body("Cannot delete user: this user has a driver profile.");
    }

    if (rideRepository.existsByRiderId(userId)) {
        return ResponseEntity.badRequest()
                .body("Cannot delete user: this user has ride history.");
    }

    userRepository.deleteById(userId);

    return ResponseEntity.ok("User deleted successfully");
}
}