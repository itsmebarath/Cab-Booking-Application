package com.cabbooking.backend.dto;

import com.cabbooking.backend.entity.VehicleCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NearbyDriverResponse {
    private Long driverId;
    private Long userId;
    private String name;
    private String phone;
    private String vehicleNumber;
    private String vehicleModel;
    private VehicleCategory vehicleCategory;
    private Double currentLatitude;
    private Double currentLongitude;
    private double distanceKm;
    private int estimatedArrivalMinutes;
}
