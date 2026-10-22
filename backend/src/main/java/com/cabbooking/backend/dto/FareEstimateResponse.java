package com.cabbooking.backend.dto;

import com.cabbooking.backend.entity.VehicleCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FareEstimateResponse {
    private VehicleCategory category;
    private String categoryName;
    private double distanceKm;
    private Integer durationMinutes;
    private BigDecimal baseFare;
    private BigDecimal perKmRate;
    private BigDecimal perMinuteRate;
    private BigDecimal minimumFare;
    private BigDecimal totalFare;
    private String currency;
}
