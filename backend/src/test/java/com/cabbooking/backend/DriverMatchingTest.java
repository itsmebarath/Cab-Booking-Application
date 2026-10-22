package com.cabbooking.backend;

import com.cabbooking.backend.dto.LocationUpdateRequest;
import com.cabbooking.backend.dto.NearbyDriverResponse;
import com.cabbooking.backend.entity.*;
import com.cabbooking.backend.repository.DriverRepository;
import com.cabbooking.backend.repository.RideRepository;
import com.cabbooking.backend.repository.UserRepository;
import com.cabbooking.backend.service.DriverMatchingService;
import com.cabbooking.backend.service.DriverService;
import com.cabbooking.backend.service.RideNotificationService;
import com.cabbooking.backend.util.GeoLocationUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DriverMatchingTest {

    @Mock
    private DriverRepository driverRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RideRepository rideRepository;

    @Mock
    private RideNotificationService rideNotificationService;

    private DriverMatchingService driverMatchingService;
    private DriverService driverService;

    // Reference point: Coimbatore Gandhipuram Bus Stand (11.0168, 76.9558)
    private static final double PICKUP_LAT = 11.0168;
    private static final double PICKUP_LNG = 76.9558;

    @BeforeEach
    void setUp() {
        driverMatchingService = new DriverMatchingService(driverRepository, rideNotificationService);
        driverService = new DriverService(
                driverRepository,
                userRepository,
                rideRepository,
                rideNotificationService,
                driverMatchingService
        );
    }

    @Test
    @DisplayName("Haversine: Accurate spherical distance calculation & input validation")
    void testGeoLocationHaversineAccuracy() {
        // Coimbatore Gandhipuram (11.0168, 76.9558) to Coimbatore Airport (11.0300, 77.0434) is ~9.7 km
        double distance = GeoLocationUtil.calculateDistanceKm(11.0168, 76.9558, 11.0300, 77.0434);
        assertTrue(distance > 9.0 && distance < 10.5, "Distance should be approximately 9.7 km, was: " + distance);

        // Same location distance must be 0.0
        double sameLocation = GeoLocationUtil.calculateDistanceKm(11.0168, 76.9558, 11.0168, 76.9558);
        assertEquals(0.0, sameLocation);

        // ETA estimation
        assertEquals(20, GeoLocationUtil.estimateDurationMinutes(10.0));
        assertEquals(1, GeoLocationUtil.estimateDurationMinutes(0.0));

        // Coordinate validations
        assertThrows(IllegalArgumentException.class, () -> GeoLocationUtil.calculateDistanceKm(null, 76.0, 11.0, 76.0));
        assertThrows(IllegalArgumentException.class, () -> GeoLocationUtil.calculateDistanceKm(95.0, 76.0, 11.0, 76.0));
        assertThrows(IllegalArgumentException.class, () -> GeoLocationUtil.calculateDistanceKm(11.0, 190.0, 11.0, 76.0));
    }

    @Test
    @DisplayName("Matching Engine: Filters available, verified, category-matched drivers and sorts by proximity")
    void testFindNearbyDriversFilteringAndSorting() {
        // Driver A: ~2.2 km away, SEDAN, available, verified
        Driver driverA = createDriver(1L, "Driver A", 11.0300, 76.9700, VehicleCategory.SEDAN, true, true);

        // Driver B: ~4.5 km away, SEDAN, available, verified
        Driver driverB = createDriver(2L, "Driver B", 11.0500, 76.9800, VehicleCategory.SEDAN, true, true);

        // Driver C: ~8.5 km away, SEDAN, available, verified (beyond 5km radius)
        Driver driverC = createDriver(3L, "Driver C", 11.0800, 77.0100, VehicleCategory.SEDAN, true, true);

        // Driver D: ~1.5 km away, SEDAN, UNAVAILABLE (should be excluded by repository)
        // (findByAvailableTrue only returns available drivers)

        // Driver E: ~1.0 km away, SEDAN, available, UNVERIFIED (should be filtered out)
        Driver driverE = createDriver(5L, "Driver E", 11.0200, 76.9600, VehicleCategory.SEDAN, true, false);

        // Driver F: ~1.8 km away, AUTO, available, verified (wrong category when searching SEDAN)
        Driver driverF = createDriver(6L, "Driver F", 11.0250, 76.9650, VehicleCategory.AUTO, true, true);

        when(driverRepository.findByAvailableTrue()).thenReturn(List.of(driverA, driverB, driverC, driverE, driverF));

        // Search with radius = 5.0 km, category = SEDAN
        List<NearbyDriverResponse> results = driverMatchingService.findNearbyDrivers(
                PICKUP_LAT,
                PICKUP_LNG,
                VehicleCategory.SEDAN,
                5.0,
                10
        );

        // Must only match Driver A and Driver B
        assertEquals(2, results.size());
        assertEquals(1L, results.get(0).getDriverId(), "Driver A must be first because it is closest (~2.2km)");
        assertEquals(2L, results.get(1).getDriverId(), "Driver B must be second (~4.5km)");
        assertTrue(results.get(0).getDistanceKm() < results.get(1).getDistanceKm(), "Results must be sorted by proximity ascending");
    }

    @Test
    @DisplayName("Spatial Dispatch: Notifies nearest matching drivers via WebSocket")
    void testDispatchRideToNearbyDrivers() {
        Driver driverA = createDriver(1L, "Driver A", 11.0300, 76.9700, VehicleCategory.SEDAN, true, true);
        Driver driverB = createDriver(2L, "Driver B", 11.0500, 76.9800, VehicleCategory.SEDAN, true, true);

        when(driverRepository.findByAvailableTrue()).thenReturn(List.of(driverA, driverB));

        User rider = User.builder().id(99L).name("Jane Rider").build();
        Ride ride = Ride.builder()
                .id(501L)
                .rider(rider)
                .pickupLocation("Gandhipuram")
                .dropLocation("Airport")
                .pickupLatitude(PICKUP_LAT)
                .pickupLongitude(PICKUP_LNG)
                .vehicleCategory(VehicleCategory.SEDAN)
                .fare(new BigDecimal("250.00"))
                .distanceKm(10.0)
                .status(RideStatus.REQUESTED)
                .bookedAt(LocalDateTime.now())
                .build();

        List<Long> dispatchedDriverIds = driverMatchingService.dispatchRideToNearbyDrivers(ride);

        assertEquals(2, dispatchedDriverIds.size());
        assertTrue(dispatchedDriverIds.contains(1L));
        assertTrue(dispatchedDriverIds.contains(2L));

        // Verify direct driver dispatch messages were sent
        verify(rideNotificationService, times(1)).sendRideDispatch(eq(1L), any());
        verify(rideNotificationService, times(1)).sendRideDispatch(eq(2L), any());
        // Verify broadcast to available topic
        verify(rideNotificationService, times(1)).sendBroadcastRideAvailable(any());
    }

    @Test
    @DisplayName("Telemetry: Driver location update streams live GPS to rider during active trip")
    void testDriverLocationStreamingDuringActiveTrip() {
        User driverUser = User.builder().id(2L).email("driver@example.com").build();
        Driver driver = createDriver(10L, "Driver Bob", 11.0100, 76.9500, VehicleCategory.SEDAN, false, true);
        driver.setUser(driverUser);

        Ride inProgressRide = Ride.builder()
                .id(777L)
                .status(RideStatus.IN_PROGRESS)
                .driver(driver)
                .build();

        when(userRepository.findByEmail("driver@example.com")).thenReturn(Optional.of(driverUser));
        when(driverRepository.findByUserId(2L)).thenReturn(Optional.of(driver));
        when(driverRepository.save(any(Driver.class))).thenAnswer(inv -> inv.getArgument(0));
        when(rideRepository.findByDriverIdAndStatusIn(eq(10L), eq(List.of(RideStatus.IN_PROGRESS))))
                .thenReturn(List.of(inProgressRide));

        LocationUpdateRequest request = LocationUpdateRequest.builder()
                .latitude(11.0200)
                .longitude(76.9600)
                .speed(35.5)
                .heading(90.0)
                .build();

        var profile = driverService.updateLocation("driver@example.com", request);

        assertNotNull(profile);
        assertEquals(11.0200, profile.getCurrentLatitude());
        assertEquals(76.9600, profile.getCurrentLongitude());

        // Verify live GPS stream sent to the active ride's channel
        verify(rideNotificationService, times(1)).sendDriverLocationUpdate(
                eq(777L),
                eq(10L),
                eq(11.0200),
                eq(76.9600),
                eq(35.5),
                eq(90.0)
        );
    }

    private Driver createDriver(
            Long id,
            String name,
            double lat,
            double lng,
            VehicleCategory category,
            boolean available,
            boolean verified) {

        User user = User.builder()
                .id(id * 10)
                .name(name)
                .email(name.toLowerCase().replace(" ", "") + "@test.com")
                .phone("900000000" + id)
                .role(Role.DRIVER)
                .build();

        return Driver.builder()
                .id(id)
                .user(user)
                .licenseNumber("DL-" + id)
                .vehicleNumber("TN-01-" + id)
                .vehicleModel("Car " + id)
                .vehicleCategory(category)
                .currentLatitude(lat)
                .currentLongitude(lng)
                .available(available)
                .verified(verified)
                .lastLocationUpdate(LocalDateTime.now())
                .build();
    }
}
