package com.cabbooking.backend.service;

import com.cabbooking.backend.dto.NearbyDriverResponse;
import com.cabbooking.backend.entity.Driver;
import com.cabbooking.backend.entity.Ride;
import com.cabbooking.backend.entity.RideStatus;
import com.cabbooking.backend.entity.VehicleCategory;
import com.cabbooking.backend.repository.DriverRepository;
import com.cabbooking.backend.util.GeoLocationUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class DriverMatchingService {

    private static final double DEFAULT_RADIUS_KM = 5.0;
    private static final double EXPANDED_RADIUS_KM = 10.0;
    private static final double MAX_SEARCH_RADIUS_KM = 30.0;
    private static final int DEFAULT_LIMIT = 10;

    private final DriverRepository driverRepository;
    private final RideNotificationService rideNotificationService;

    public DriverMatchingService(
            DriverRepository driverRepository,
            RideNotificationService rideNotificationService) {
        this.driverRepository = driverRepository;
        this.rideNotificationService = rideNotificationService;
    }

    /**
     * Finds nearby available and verified drivers matching the requested vehicle category
     * sorted by proximity to the pickup coordinates.
     */
    @Transactional(readOnly = true)
    public List<NearbyDriverResponse> findNearbyDrivers(
            Double pickupLat,
            Double pickupLng,
            VehicleCategory category,
            Double searchRadiusKm,
            Integer limit) {

        if (pickupLat == null || pickupLng == null) {
            throw new IllegalArgumentException("Pickup coordinates (latitude and longitude) must be provided");
        }

        double radius = (searchRadiusKm != null && searchRadiusKm > 0)
                ? Math.min(searchRadiusKm, MAX_SEARCH_RADIUS_KM)
                : DEFAULT_RADIUS_KM;

        int maxResults = (limit != null && limit > 0) ? limit : DEFAULT_LIMIT;

        List<Driver> availableDrivers = driverRepository.findByAvailableTrue();

        List<NearbyDriverResponse> nearbyList = new ArrayList<>();

        for (Driver driver : availableDrivers) {
            // Must be verified
            if (driver.getVerified() != null && !driver.isVerified()) {
                continue;
            }

            // Must match vehicle category if specified (drivers with null category accept all standard rides)
            if (category != null && driver.getVehicleCategory() != null && driver.getVehicleCategory() != category) {
                continue;
            }

            // Must have valid last-known GPS coordinates
            if (driver.getCurrentLatitude() == null || driver.getCurrentLongitude() == null) {
                continue;
            }

            double distanceKm = GeoLocationUtil.calculateDistanceKm(
                    pickupLat,
                    pickupLng,
                    driver.getCurrentLatitude(),
                    driver.getCurrentLongitude()
            );

            if (distanceKm <= radius) {
                int eta = GeoLocationUtil.estimateDurationMinutes(distanceKm);
                String driverName = driver.getUser() != null ? driver.getUser().getName() : "Driver";
                String driverPhone = driver.getUser() != null ? driver.getUser().getPhone() : "";

                nearbyList.add(NearbyDriverResponse.builder()
                        .driverId(driver.getId())
                        .userId(driver.getUser() != null ? driver.getUser().getId() : null)
                        .name(driverName)
                        .phone(driverPhone)
                        .vehicleNumber(driver.getVehicleNumber())
                        .vehicleModel(driver.getVehicleModel())
                        .vehicleCategory(driver.getVehicleCategory())
                        .currentLatitude(driver.getCurrentLatitude())
                        .currentLongitude(driver.getCurrentLongitude())
                        .distanceKm(distanceKm)
                        .estimatedArrivalMinutes(eta)
                        .build());
            }
        }

        // Sort by distance ascending (nearest first)
        nearbyList.sort(Comparator.comparingDouble(NearbyDriverResponse::getDistanceKm));

        // Limit results
        if (nearbyList.size() > maxResults) {
            return nearbyList.subList(0, maxResults);
        }

        return nearbyList;
    }

    /**
     * Dispatches a newly booked ride request to nearest eligible drivers.
     * Starts with a 5km radius, expanding to 10km if no drivers are in immediate vicinity.
     */
    public List<Long> dispatchRideToNearbyDrivers(Ride ride) {
        if (ride == null || ride.getStatus() != RideStatus.REQUESTED) {
            return Collections.emptyList();
        }

        Map<String, Object> basePayload = buildRideBroadcastPayload(ride);

        if (ride.getPickupLatitude() == null || ride.getPickupLongitude() == null) {
            // Broadcast generally if coordinates are not available
            rideNotificationService.sendBroadcastRideAvailable(basePayload);
            return Collections.emptyList();
        }

        // 1. Search primary radius (5.0 km)
        List<NearbyDriverResponse> candidates = findNearbyDrivers(
                ride.getPickupLatitude(),
                ride.getPickupLongitude(),
                ride.getVehicleCategory(),
                DEFAULT_RADIUS_KM,
                5
        );

        // 2. Expand radius to 10 km if needed
        if (candidates.isEmpty()) {
            candidates = findNearbyDrivers(
                    ride.getPickupLatitude(),
                    ride.getPickupLongitude(),
                    ride.getVehicleCategory(),
                    EXPANDED_RADIUS_KM,
                    5
            );
        }

        List<Long> notifiedDriverIds = new ArrayList<>();

        for (NearbyDriverResponse candidate : candidates) {
            Map<String, Object> driverSpecificPayload = new HashMap<>(basePayload);
            driverSpecificPayload.put("distanceToPickupKm", candidate.getDistanceKm());
            driverSpecificPayload.put("estimatedEtaMinutes", candidate.getEstimatedArrivalMinutes());

            rideNotificationService.sendRideDispatch(candidate.getDriverId(), driverSpecificPayload);
            notifiedDriverIds.add(candidate.getDriverId());
        }

        // Also broadcast to public available rides topic for open dashboards
        rideNotificationService.sendBroadcastRideAvailable(basePayload);

        return notifiedDriverIds;
    }

    private Map<String, Object> buildRideBroadcastPayload(Ride ride) {
        Map<String, Object> map = new HashMap<>();
        map.put("rideId", ride.getId());
        map.put("riderId", ride.getRider() != null ? ride.getRider().getId() : null);
        map.put("riderName", ride.getRider() != null ? ride.getRider().getName() : "Rider");
        map.put("pickupLocation", ride.getPickupLocation());
        map.put("dropLocation", ride.getDropLocation());
        map.put("pickupLatitude", ride.getPickupLatitude());
        map.put("pickupLongitude", ride.getPickupLongitude());
        map.put("dropLatitude", ride.getDropLatitude());
        map.put("dropLongitude", ride.getDropLongitude());
        map.put("fare", ride.getFare());
        map.put("distanceKm", ride.getDistanceKm());
        map.put("vehicleCategory", ride.getVehicleCategory() != null ? ride.getVehicleCategory().name() : null);
        map.put("status", ride.getStatus().name());
        map.put("bookedAt", ride.getBookedAt() != null ? ride.getBookedAt().toString() : null);
        return map;
    }
}
