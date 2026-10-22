package com.cabbooking.backend.service;

import com.cabbooking.backend.dto.DriverProfileResponse;
import com.cabbooking.backend.dto.DriverRequest;
import com.cabbooking.backend.dto.LocationUpdateRequest;
import com.cabbooking.backend.dto.NearbyDriverResponse;
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

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DriverService {

    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final RideRepository rideRepository;
    private final RideNotificationService rideNotificationService;
    private final DriverMatchingService driverMatchingService;

    @org.springframework.beans.factory.annotation.Autowired
    public DriverService(
            DriverRepository driverRepository,
            UserRepository userRepository,
            RideRepository rideRepository,
            RideNotificationService rideNotificationService,
            DriverMatchingService driverMatchingService) {
        this.driverRepository = driverRepository;
        this.userRepository = userRepository;
        this.rideRepository = rideRepository;
        this.rideNotificationService = rideNotificationService;
        this.driverMatchingService = driverMatchingService;
    }

    public DriverService(
            DriverRepository driverRepository,
            UserRepository userRepository) {
        this(driverRepository, userRepository, null, null, null);
    }

    // 1. Register a new driver profile
    @Transactional
    public Driver registerDriver(DriverRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() != Role.DRIVER && user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only users with the DRIVER role can register as drivers"
            );
        }

        if (driverRepository.findByUserId(user.getId()).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Driver profile already exists for this user"
            );
        }

        VehicleCategory category = parseCategory(request.getVehicleCategory());

        Driver driver = Driver.builder()
                .user(user)
                .licenseNumber(request.getLicenseNumber())
                .vehicleNumber(request.getVehicleNumber())
                .vehicleModel(request.getVehicleModel())
                .vehicleCategory(category)
                .available(false)
                .verified(true)
                .build();

        return driverRepository.save(driver);
    }

    // 2. Update driver availability
    @Transactional
    public Driver updateAvailability(Long driverId, boolean available) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        driver.setAvailable(available);
        return driverRepository.save(driver);
    }

    @Transactional
    public Driver updateAvailability(String email, boolean available) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Driver driver = driverRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver profile not found"));

        driver.setAvailable(available);
        return driverRepository.save(driver);
    }

    // 3. Update driver live GPS location & broadcast to active ride channel
    @Transactional
    public DriverProfileResponse updateLocation(String email, LocationUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Driver driver = driverRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver profile not found"));

        return doUpdateLocation(driver, user, request);
    }

    @Transactional
    public DriverProfileResponse updateLocation(Long driverId, LocationUpdateRequest request) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        User user = driver.getUser();
        return doUpdateLocation(driver, user, request);
    }

    private DriverProfileResponse doUpdateLocation(Driver driver, User user, LocationUpdateRequest request) {
        if (request == null || request.getLatitude() == null || request.getLongitude() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Latitude and longitude must be provided");
        }

        driver.setCurrentLatitude(request.getLatitude());
        driver.setCurrentLongitude(request.getLongitude());
        driver.setLastLocationUpdate(LocalDateTime.now());

        Driver savedDriver = driverRepository.save(driver);

        // If the driver is currently on an IN_PROGRESS ride, stream GPS coordinates to rider
        List<Ride> activeRides = rideRepository.findByDriverIdAndStatusIn(
                savedDriver.getId(),
                List.of(RideStatus.IN_PROGRESS)
        );

        if (!activeRides.isEmpty()) {
            Ride activeRide = activeRides.get(0);
            rideNotificationService.sendDriverLocationUpdate(
                    activeRide.getId(),
                    savedDriver.getId(),
                    request.getLatitude(),
                    request.getLongitude(),
                    request.getSpeed(),
                    request.getHeading()
            );
        }

        return mapToProfileResponse(savedDriver, user);
    }

    // 4. Find all available drivers
    @Transactional(readOnly = true)
    public List<Driver> getAvailableDrivers() {
        return driverRepository.findByAvailableTrue();
    }

    // 5. Find nearby drivers for rider map
    @Transactional(readOnly = true)
    public List<NearbyDriverResponse> getNearbyDrivers(
            double latitude,
            double longitude,
            VehicleCategory category,
            Double radiusKm,
            Integer limit) {
        return driverMatchingService.findNearbyDrivers(latitude, longitude, category, radiusKm, limit);
    }

    // 6. Get profile for authenticated driver
    @Transactional(readOnly = true)
    public DriverProfileResponse getMyProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!Role.DRIVER.equals(user.getRole()) && !Role.ADMIN.equals(user.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Access denied: User does not have the DRIVER role"
            );
        }

        Driver driver = driverRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Driver profile not found for this user"
                ));

        return mapToProfileResponse(driver, user);
    }

    private DriverProfileResponse mapToProfileResponse(Driver driver, User user) {
        return new DriverProfileResponse(
                driver.getId(),
                user != null ? user.getId() : null,
                user != null ? user.getName() : "Driver",
                user != null ? user.getEmail() : "",
                driver.getVehicleNumber(),
                driver.getVehicleModel(),
                driver.getLicenseNumber(),
                driver.isAvailable(),
                driver.getVehicleCategory(),
                driver.isVerified(),
                driver.getCurrentLatitude(),
                driver.getCurrentLongitude(),
                driver.getLastLocationUpdate()
        );
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