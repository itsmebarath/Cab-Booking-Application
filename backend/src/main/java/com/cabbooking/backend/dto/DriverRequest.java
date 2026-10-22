package com.cabbooking.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DriverRequest {

    private Long userId;

    private String licenseNumber;

    private String vehicleNumber;

    private String vehicleModel;

    private String vehicleCategory;
}