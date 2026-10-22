package com.cabbooking.backend.config;

import com.cabbooking.backend.entity.Role;
import com.cabbooking.backend.entity.User;
import com.cabbooking.backend.repository.DriverRepository;
import com.cabbooking.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class AdminAccountInitializer {

    @Bean
    CommandLineRunner createInitialAdmin(
            UserRepository userRepository,
            DriverRepository driverRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            try {
                driverRepository.findAll().forEach(d -> {
                    if (d.getVerified() == null || Boolean.FALSE.equals(d.getVerified())) {
                        d.setVerified(true);
                        driverRepository.save(d);
                    }
                });
            } catch (Exception ignored) {}

            String email = System.getenv("ADMIN_EMAIL");
            String password = System.getenv("ADMIN_PASSWORD");

            if (email == null || email.isBlank()
                    || password == null || password.isBlank()) {
                System.out.println(
                        "Admin initialization skipped: credentials not configured."
                );
                return;
            }

            if (userRepository.findByEmail(email).isPresent()) {
                System.out.println("Admin account already exists.");
                return;
            }

            User admin = User.builder()
                    .name("Administrator")
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .phone(System.getenv("ADMIN_PHONE") != null
                            ? System.getenv("ADMIN_PHONE")
                            : "0000000000")
                    .role(Role.ADMIN)
                    .createdAt(LocalDateTime.now())
                    .build();

            userRepository.save(admin);

            System.out.println("Initial Admin account created successfully.");
        };
    }
}