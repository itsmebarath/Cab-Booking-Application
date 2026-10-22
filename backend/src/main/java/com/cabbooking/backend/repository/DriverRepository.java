package com.cabbooking.backend.repository;

import com.cabbooking.backend.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DriverRepository extends JpaRepository<Driver, Long> {

    Optional<Driver> findByUserId(Long userId);

    List<Driver> findByAvailableTrue();

    boolean existsByUserId(Long userId);
}