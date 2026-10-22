package com.cabbooking.backend.service;

import com.cabbooking.backend.dto.LoginRequest;
import com.cabbooking.backend.dto.LoginResponse;
import com.cabbooking.backend.entity.Driver;
import com.cabbooking.backend.entity.Role;
import com.cabbooking.backend.entity.User;
import com.cabbooking.backend.repository.DriverRepository;
import com.cabbooking.backend.repository.UserRepository;
import com.cabbooking.backend.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            DriverRepository driverRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.driverRepository = driverRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtService.generateToken(user);

        Long driverId = null;

        // If this is a driver, verify and resolve their driver profile ID
        if (Role.DRIVER.equals(user.getRole())) {
            Driver driver = driverRepository.findByUserId(user.getId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Driver profile not found for this user. Please complete driver profile registration."));

            driverId = driver.getId();
        }

        return new LoginResponse(
                token,
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.getId(),
                driverId
        );
    }
}