package com.cabbooking.backend.service;

import com.cabbooking.backend.dto.FareEstimateResponse;
import com.cabbooking.backend.dto.RideRequest;
import com.cabbooking.backend.entity.Driver;
import com.cabbooking.backend.entity.Ride;
import com.cabbooking.backend.entity.RideStatus;
import com.cabbooking.backend.entity.Role;
import com.cabbooking.backend.entity.User;
import com.cabbooking.backend.entity.VehicleCategory;
import com.cabbooking.backend.repository.DriverRepository;
import com.cabbooking.backend.repository.RideRepository;
import com.cabbooking.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class RideService {

    // Fare parameters: Base Fare, Per Km Rate, Per Minute Rate, Minimum Fare
    // BIKE: Base 25, 8/km, 1/min (Min 30)
    private static final BigDecimal BIKE_BASE = new BigDecimal("25.00");
    private static final BigDecimal BIKE_PER_KM = new BigDecimal("8.00");
    private static final BigDecimal BIKE_PER_MIN = new BigDecimal("1.00");
    private static final BigDecimal BIKE_MIN = new BigDecimal("30.00");

    // AUTO: Base 35, 11/km, 1.5/min (Min 40)
    private static final BigDecimal AUTO_BASE = new BigDecimal("35.00");
    private static final BigDecimal AUTO_PER_KM = new BigDecimal("11.00");
    private static final BigDecimal AUTO_PER_MIN = new BigDecimal("1.50");
    private static final BigDecimal AUTO_MIN = new BigDecimal("40.00");

    // SEDAN: Base 50, 15/km, 2/min (Min 60)
    private static final BigDecimal SEDAN_BASE = new BigDecimal("50.00");
    private static final BigDecimal SEDAN_PER_KM = new BigDecimal("15.00");
    private static final BigDecimal SEDAN_PER_MIN = new BigDecimal("2.00");
    private static final BigDecimal SEDAN_MIN = new BigDecimal("60.00");

    // SUV: Base 80, 20/km, 2.5/min (Min 100)
    private static final BigDecimal SUV_BASE = new BigDecimal("80.00");
    private static final BigDecimal SUV_PER_KM = new BigDecimal("20.00");
    private static final BigDecimal SUV_PER_MIN = new BigDecimal("2.50");
    private static final BigDecimal SUV_MIN = new BigDecimal("100.00");

    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final RideNotificationService rideNotificationService;
    private final DriverMatchingService driverMatchingService;

    @org.springframework.beans.factory.annotation.Autowired
    public RideService(
            RideRepository rideRepository,
            UserRepository userRepository,
            DriverRepository driverRepository,
            RideNotificationService rideNotificationService,
            DriverMatchingService driverMatchingService) {
        this.rideRepository = rideRepository;
        this.userRepository = userRepository;
        this.driverRepository = driverRepository;
        this.rideNotificationService = rideNotificationService;
        this.driverMatchingService = driverMatchingService;
    }

    public RideService(
            RideRepository rideRepository,
            UserRepository userRepository,
            DriverRepository driverRepository,
            RideNotificationService rideNotificationService) {
        this(rideRepository, userRepository, driverRepository, rideNotificationService, null);
    }

    // 1. Calculate fare by category, distance, and duration
    public BigDecimal calculateFare(double distanceKm, Integer durationMinutes, VehicleCategory category) {
        if (!Double.isFinite(distanceKm) || distanceKm <= 0) {
            throw new IllegalArgumentException("Distance must be greater than zero");
        }

        VehicleCategory cat = category != null ? category : VehicleCategory.SEDAN;
        BigDecimal baseFare;
        BigDecimal perKmRate;
        BigDecimal perMinRate;
        BigDecimal minFare;

        switch (cat) {
            case BIKE -> {
                baseFare = BIKE_BASE;
                perKmRate = BIKE_PER_KM;
                perMinRate = BIKE_PER_MIN;
                minFare = BIKE_MIN;
            }
            case AUTO -> {
                baseFare = AUTO_BASE;
                perKmRate = AUTO_PER_KM;
                perMinRate = AUTO_PER_MIN;
                minFare = AUTO_MIN;
            }
            case SUV -> {
                baseFare = SUV_BASE;
                perKmRate = SUV_PER_KM;
                perMinRate = SUV_PER_MIN;
                minFare = SUV_MIN;
            }
            case SEDAN -> {
                baseFare = SEDAN_BASE;
                perKmRate = SEDAN_PER_KM;
                perMinRate = SEDAN_PER_MIN;
                minFare = SEDAN_MIN;
            }
            default -> {
                baseFare = SEDAN_BASE;
                perKmRate = SEDAN_PER_KM;
                perMinRate = SEDAN_PER_MIN;
                minFare = SEDAN_MIN;
            }
        }

        BigDecimal distanceCost = perKmRate.multiply(BigDecimal.valueOf(distanceKm));
        BigDecimal durationCost = (durationMinutes != null && durationMinutes > 0)
                ? perMinRate.multiply(BigDecimal.valueOf(durationMinutes))
                : BigDecimal.ZERO;

        BigDecimal total = baseFare.add(distanceCost).add(durationCost);
        if (total.compareTo(minFare) < 0) {
            total = minFare;
        }

        return total.setScale(2, RoundingMode.HALF_UP);
    }

    // Backward-compatible calculateFare overload
    public BigDecimal calculateFare(double distanceKm) {
        return calculateFare(distanceKm, null, VehicleCategory.SEDAN);
    }

    public FareEstimateResponse getFareEstimate(double distanceKm, Integer durationMinutes, VehicleCategory category) {
        VehicleCategory cat = category != null ? category : VehicleCategory.SEDAN;
        BigDecimal baseFare;
        BigDecimal perKmRate;
        BigDecimal perMinRate;
        BigDecimal minFare;

        switch (cat) {
            case BIKE -> {
                baseFare = BIKE_BASE;
                perKmRate = BIKE_PER_KM;
                perMinRate = BIKE_PER_MIN;
                minFare = BIKE_MIN;
            }
            case AUTO -> {
                baseFare = AUTO_BASE;
                perKmRate = AUTO_PER_KM;
                perMinRate = AUTO_PER_MIN;
                minFare = AUTO_MIN;
            }
            case SUV -> {
                baseFare = SUV_BASE;
                perKmRate = SUV_PER_KM;
                perMinRate = SUV_PER_MIN;
                minFare = SUV_MIN;
            }
            default -> {
                baseFare = SEDAN_BASE;
                perKmRate = SEDAN_PER_KM;
                perMinRate = SEDAN_PER_MIN;
                minFare = SEDAN_MIN;
            }
        }

        BigDecimal totalFare = calculateFare(distanceKm, durationMinutes, cat);

        return FareEstimateResponse.builder()
                .category(cat)
                .categoryName(cat.name())
                .distanceKm(distanceKm)
                .durationMinutes(durationMinutes)
                .baseFare(baseFare)
                .perKmRate(perKmRate)
                .perMinuteRate(perMinRate)
                .minimumFare(minFare)
                .totalFare(totalFare)
                .currency("INR")
                .build();
    }

    public List<FareEstimateResponse> getAllFareEstimates(double distanceKm, Integer durationMinutes) {
        List<FareEstimateResponse> estimates = new ArrayList<>();
        for (VehicleCategory cat : VehicleCategory.values()) {
            estimates.add(getFareEstimate(distanceKm, durationMinutes, cat));
        }
        return estimates;
    }

    // 2. Book a ride with authentication verification
    @Transactional
    public Ride bookRide(String userEmail, RideRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ride request body cannot be empty");
        }

        if (request.getPickupLocation() == null || request.getPickupLocation().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup location is required");
        }

        if (request.getDropLocation() == null || request.getDropLocation().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Drop location is required");
        }

        if (request.getDistanceKm() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Distance must be greater than 0");
        }

        User rider = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rider account not found"));

        if (rider.getRole() != Role.RIDER && rider.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only registered riders can book rides");
        }

        // Check if rider already has an active ride
        List<Ride> activeRides = rideRepository.findByRiderIdAndStatusIn(
                rider.getId(),
                List.of(RideStatus.REQUESTED, RideStatus.ACCEPTED, RideStatus.IN_PROGRESS)
        );

        if (!activeRides.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You already have an active ride in status: " + activeRides.get(0).getStatus()
            );
        }

        VehicleCategory category = parseCategory(request.getVehicleCategory());
        BigDecimal fare = calculateFare(request.getDistanceKm(), request.getEstimatedDurationMinutes(), category);

        Ride ride = Ride.builder()
                .rider(rider)
                .pickupLocation(request.getPickupLocation())
                .dropLocation(request.getDropLocation())
                .pickupLatitude(request.getPickupLatitude())
                .pickupLongitude(request.getPickupLongitude())
                .dropLatitude(request.getDropLatitude())
                .dropLongitude(request.getDropLongitude())
                .distanceKm(request.getDistanceKm())
                .estimatedDurationMinutes(request.getEstimatedDurationMinutes())
                .vehicleCategory(category)
                .fare(fare)
                .status(RideStatus.REQUESTED)
                .bookedAt(LocalDateTime.now())
                .build();

        Ride savedRide = rideRepository.save(ride);

        rideNotificationService.sendRideStatusUpdate(
                savedRide.getId(),
                savedRide.getStatus().name(),
                "Ride requested successfully"
        );

        if (driverMatchingService != null) {
            try {
                driverMatchingService.dispatchRideToNearbyDrivers(savedRide);
            } catch (Exception ignored) {}
        }

        return savedRide;
    }

    // Overloaded bookRide for legacy callers/tests
    @Transactional
    public Ride bookRide(Long riderId, String pickupLocation, String dropLocation, double distanceKm) {
        User rider = userRepository.findById(riderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rider not found"));

        RideRequest request = new RideRequest();
        request.setRiderId(riderId);
        request.setPickupLocation(pickupLocation);
        request.setDropLocation(dropLocation);
        request.setDistanceKm(distanceKm);

        return bookRide(rider.getEmail(), request);
    }

    // 3. Accept a ride with pessimistic concurrency locking
    @Transactional
    public Ride acceptRide(Long rideId, String driverEmail) {
        User driverUser = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver user not found"));

        if (driverUser.getRole() != Role.DRIVER && driverUser.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only drivers can accept rides");
        }

        Driver driver = driverRepository.findByUserId(driverUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver profile not found"));

        return doAcceptRide(rideId, driver);
    }

    // Overloaded acceptRide for legacy callers/tests
    @Transactional
    public Ride acceptRide(Long rideId, Long driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        return doAcceptRide(rideId, driver);
    }

    private Ride doAcceptRide(Long rideId, Driver driver) {
        if (!driver.isAvailable()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Driver is not available");
        }

        // Check if driver already has an active ride
        List<Ride> activeDriverRides = rideRepository.findByDriverIdAndStatusIn(
                driver.getId(),
                List.of(RideStatus.ACCEPTED, RideStatus.IN_PROGRESS)
        );

        if (!activeDriverRides.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Driver already has an active ride in status: " + activeDriverRides.get(0).getStatus()
            );
        }

        // Concurrency protection: Lock the row using pessimistic write lock
        Ride ride = rideRepository.findByIdForUpdate(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride not found"));

        if (ride.getStatus() != RideStatus.REQUESTED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This ride is no longer available for acceptance (current status: " + ride.getStatus() + ")"
            );
        }

        ride.setDriver(driver);
        ride.setStatus(RideStatus.ACCEPTED);

        driver.setAvailable(false);
        driverRepository.save(driver);

        Ride savedRide = rideRepository.save(ride);

        String driverName = driver.getUser() != null ? driver.getUser().getName() : "a driver";
        rideNotificationService.sendRideStatusUpdate(
                savedRide.getId(),
                savedRide.getStatus().name(),
                "Ride accepted by driver " + driverName
        );

        return savedRide;
    }

    // 4. Start an accepted ride
    @Transactional
    public Ride startRide(Long rideId, String driverEmail) {
        User driverUser = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver user not found"));

        if (driverUser.getRole() != Role.DRIVER && driverUser.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only drivers can start rides");
        }

        Driver driver = driverRepository.findByUserId(driverUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver profile not found"));

        return doStartRide(rideId, driver.getId());
    }

    @Transactional
    public Ride startRide(Long rideId, Long driverId) {
        return doStartRide(rideId, driverId);
    }

    private Ride doStartRide(Long rideId, Long driverId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride not found"));

        if (ride.getStatus() != RideStatus.ACCEPTED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only accepted rides can be started (current status: " + ride.getStatus() + ")"
            );
        }

        if (ride.getDriver() == null || !ride.getDriver().getId().equals(driverId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This ride is not assigned to this driver");
        }

        ride.setStatus(RideStatus.IN_PROGRESS);
        ride.setStartedAt(LocalDateTime.now());

        Ride savedRide = rideRepository.save(ride);

        rideNotificationService.sendRideStatusUpdate(
                savedRide.getId(),
                savedRide.getStatus().name(),
                "Ride has started"
        );

        return savedRide;
    }

    // 5. Complete an in-progress ride
    @Transactional
    public Ride completeRide(Long rideId, String driverEmail) {
        User driverUser = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver user not found"));

        if (driverUser.getRole() != Role.DRIVER && driverUser.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only drivers can complete rides");
        }

        Driver driver = driverRepository.findByUserId(driverUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver profile not found"));

        return doCompleteRide(rideId, driver.getId());
    }

    @Transactional
    public Ride completeRide(Long rideId, Long driverId) {
        return doCompleteRide(rideId, driverId);
    }

    private Ride doCompleteRide(Long rideId, Long driverId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride not found"));

        if (ride.getStatus() != RideStatus.IN_PROGRESS) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only rides in progress can be completed (current status: " + ride.getStatus() + ")"
            );
        }

        if (ride.getDriver() == null || !ride.getDriver().getId().equals(driverId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This ride is not assigned to this driver");
        }

        ride.setStatus(RideStatus.COMPLETED);
        ride.setCompletedAt(LocalDateTime.now());

        Driver driver = ride.getDriver();
        driver.setAvailable(true);
        driverRepository.save(driver);

        Ride savedRide = rideRepository.save(ride);

        rideNotificationService.sendRideStatusUpdate(
                savedRide.getId(),
                savedRide.getStatus().name(),
                "Ride completed"
        );

        return savedRide;
    }

    // 6. Cancel a ride
    @Transactional
    public Ride cancelRide(Long rideId, String userEmail, String cancellationReason) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride not found"));

        boolean isRider = ride.getRider() != null && ride.getRider().getId().equals(user.getId());
        boolean isDriver = ride.getDriver() != null && ride.getDriver().getUser() != null
                && ride.getDriver().getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isRider && !isDriver && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to cancel this ride");
        }

        return doCancelRide(ride, cancellationReason);
    }

    @Transactional
    public Ride cancelRide(Long rideId, Long riderId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride not found"));

        if (ride.getRider() == null || !ride.getRider().getId().equals(riderId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot cancel another rider's ride");
        }

        return doCancelRide(ride, "Cancelled by rider");
    }

    private Ride doCancelRide(Ride ride, String reason) {
        if (ride.getStatus() != RideStatus.REQUESTED && ride.getStatus() != RideStatus.ACCEPTED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only requested or accepted rides can be cancelled (current status: " + ride.getStatus() + ")"
            );
        }

        if (ride.getDriver() != null) {
            Driver driver = ride.getDriver();
            driver.setAvailable(true);
            driverRepository.save(driver);
        }

        ride.setStatus(RideStatus.CANCELLED);
        ride.setCancelledAt(LocalDateTime.now());
        ride.setCancellationReason(reason != null && !reason.isBlank() ? reason : "Cancelled by user");

        Ride savedRide = rideRepository.save(ride);

        rideNotificationService.sendRideStatusUpdate(
                savedRide.getId(),
                savedRide.getStatus().name(),
                "Ride cancelled"
        );

        return savedRide;
    }

    // 7. Active ride queries
    @Transactional(readOnly = true)
    public Optional<Ride> getActiveRideForRider(String email) {
        User rider = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rider not found"));
        return getActiveRideForRider(rider.getId());
    }

    @Transactional(readOnly = true)
    public Optional<Ride> getActiveRideForRider(Long riderId) {
        List<Ride> activeRides = rideRepository.findByRiderIdAndStatusIn(
                riderId,
                List.of(RideStatus.REQUESTED, RideStatus.ACCEPTED, RideStatus.IN_PROGRESS)
        );
        return activeRides.isEmpty() ? Optional.empty() : Optional.of(activeRides.get(0));
    }

    @Transactional(readOnly = true)
    public Optional<Ride> getActiveRideForDriver(String email) {
        User driverUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver user not found"));
        Driver driver = driverRepository.findByUserId(driverUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver profile not found"));
        return getActiveRideForDriver(driver.getId());
    }

    @Transactional(readOnly = true)
    public Optional<Ride> getActiveRideForDriver(Long driverId) {
        List<Ride> activeRides = rideRepository.findByDriverIdAndStatusIn(
                driverId,
                List.of(RideStatus.ACCEPTED, RideStatus.IN_PROGRESS)
        );
        return activeRides.isEmpty() ? Optional.empty() : Optional.of(activeRides.get(0));
    }

    // 8. History and available rides
    @Transactional(readOnly = true)
    public List<Ride> getRideHistory(Long riderId) {
        userRepository.findById(riderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rider not found"));
        return rideRepository.findByRiderId(riderId);
    }

    @Transactional(readOnly = true)
    public List<Ride> getRideHistoryByEmail(String email) {
        User rider = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rider not found"));
        return rideRepository.findByRiderId(rider.getId());
    }

    @Transactional(readOnly = true)
    public List<Ride> getDriverRideHistory(Long driverId) {
        driverRepository.findById(driverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));
        return rideRepository.findByDriverId(driverId);
    }

    @Transactional(readOnly = true)
    public List<Ride> getDriverRideHistoryByEmail(String email) {
        User driverUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver user not found"));
        Driver driver = driverRepository.findByUserId(driverUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver profile not found"));
        return rideRepository.findByDriverId(driver.getId());
    }

    @Transactional(readOnly = true)
    public Ride getRideById(Long rideId) {
        return rideRepository.findById(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride not found"));
    }

    @Transactional(readOnly = true)
    public List<Ride> getAvailableRides() {
        return rideRepository.findByStatus(RideStatus.REQUESTED);
    }

    private VehicleCategory parseCategory(String rawCategory) {
        if (rawCategory == null || rawCategory.isBlank()) {
            return VehicleCategory.SEDAN;
        }
        try {
            return VehicleCategory.valueOf(rawCategory.toUpperCase().trim());
        } catch (IllegalArgumentException ex) {
            return VehicleCategory.SEDAN;
        }
    }
}