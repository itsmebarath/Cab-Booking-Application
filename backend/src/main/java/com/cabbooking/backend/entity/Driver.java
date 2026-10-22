package com.cabbooking.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "drivers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, unique = true)
    private String licenseNumber;

    @Column(nullable = false)
    private String vehicleNumber;

    @Column(nullable = false)
    private String vehicleModel;

    @Enumerated(EnumType.STRING)
    private VehicleCategory vehicleCategory;

    @Column(nullable = false)
    private boolean available;

    @Builder.Default
    @Column(nullable = true)
    private Boolean verified = true;

    public boolean isVerified() {
        return Boolean.TRUE.equals(verified);
    }

    private Double currentLatitude;

    private Double currentLongitude;

    private java.time.LocalDateTime lastLocationUpdate;
}