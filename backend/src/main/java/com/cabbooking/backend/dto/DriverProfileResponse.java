package com.cabbooking.backend.dto;

import com.cabbooking.backend.entity.VehicleCategory;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class DriverProfileResponse {

    @JsonProperty("driverId")
    private Long driverId;

    @JsonProperty("userId")
    private Long userId;

    @JsonProperty("name")
    private String name;

    @JsonProperty("email")
    private String email;

    @JsonProperty("vehicleNumber")
    private String vehicleNumber;

    @JsonProperty("vehicleModel")
    private String vehicleModel;

    @JsonProperty("licenseNumber")
    private String licenseNumber;

    @JsonProperty("available")
    private boolean available;

    @JsonProperty("vehicleCategory")
    private VehicleCategory vehicleCategory;

    @JsonProperty("verified")
    private Boolean verified = true;

    @JsonProperty("currentLatitude")
    private Double currentLatitude;

    @JsonProperty("currentLongitude")
    private Double currentLongitude;

    @JsonProperty("lastLocationUpdate")
    private LocalDateTime lastLocationUpdate;

    // Backward-compatible 8-argument constructor
    public DriverProfileResponse(
            Long driverId,
            Long userId,
            String name,
            String email,
            String vehicleNumber,
            String vehicleModel,
            String licenseNumber,
            boolean available) {
        this.driverId = driverId;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.vehicleNumber = vehicleNumber;
        this.vehicleModel = vehicleModel;
        this.licenseNumber = licenseNumber;
        this.available = available;
        this.verified = true;
    }

    // Full constructor
    public DriverProfileResponse(
            Long driverId,
            Long userId,
            String name,
            String email,
            String vehicleNumber,
            String vehicleModel,
            String licenseNumber,
            boolean available,
            VehicleCategory vehicleCategory,
            Boolean verified,
            Double currentLatitude,
            Double currentLongitude,
            LocalDateTime lastLocationUpdate) {
        this.driverId = driverId;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.vehicleNumber = vehicleNumber;
        this.vehicleModel = vehicleModel;
        this.licenseNumber = licenseNumber;
        this.available = available;
        this.vehicleCategory = vehicleCategory;
        this.verified = verified != null ? verified : true;
        this.currentLatitude = currentLatitude;
        this.currentLongitude = currentLongitude;
        this.lastLocationUpdate = lastLocationUpdate;
    }
}
