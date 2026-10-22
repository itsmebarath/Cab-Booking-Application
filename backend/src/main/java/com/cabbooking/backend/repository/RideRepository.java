package com.cabbooking.backend.repository;

import com.cabbooking.backend.entity.Ride;
import com.cabbooking.backend.entity.RideStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RideRepository extends JpaRepository<Ride, Long> {

    // Find all rides booked by a particular rider
    List<Ride> findByRiderId(Long riderId);

    // Find all rides assigned to a particular driver
    List<Ride> findByDriverId(Long driverId);

    // Find rides by their current status
    List<Ride> findByStatus(RideStatus status);

    // Find all rides booked by a rider with a specific status
    List<Ride> findByRiderIdAndStatus(Long riderId, RideStatus status);

    // Find active rides for a rider (e.g. REQUESTED, ACCEPTED, IN_PROGRESS)
    List<Ride> findByRiderIdAndStatusIn(Long riderId, Collection<RideStatus> statuses);

    // Find active rides for a driver (e.g. ACCEPTED, IN_PROGRESS)
    List<Ride> findByDriverIdAndStatusIn(Long driverId, Collection<RideStatus> statuses);

    long countByStatus(RideStatus status);

    boolean existsByRiderId(Long riderId);

    // Concurrency protection: Row-level pessimistic lock for ride acceptance
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Ride r WHERE r.id = :id")
    Optional<Ride> findByIdForUpdate(@Param("id") Long id);
}