package com.cabbooking.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RideRequest {

    private Long riderId;

    private String pickupLocation;

    private String dropLocation;

    private double distanceKm;

    private Double pickupLatitude;

    private Double pickupLongitude;

    private Double dropLatitude;

    private Double dropLongitude;

    private String vehicleCategory;

    private Integer estimatedDurationMinutes;
}