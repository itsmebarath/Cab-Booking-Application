package com.cabbooking.backend;

import com.cabbooking.backend.entity.User;
import com.cabbooking.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminPasswordResetRunner {

    @Bean
    CommandLineRunner resetAdminPassword(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${ADMIN_EMAIL:}") String adminEmail,
            @Value("${ADMIN_PASSWORD:}") String adminPassword) {

        return args -> {
            if (adminEmail.isBlank() || adminPassword.isBlank()) {
                System.out.println(
                        "Admin password reset skipped: credentials not configured."
                );
                return;
            }

            User admin = userRepository.findByEmail(adminEmail)
                    .orElse(null);

            if (admin == null) {
                System.out.println(
                        "Admin password reset skipped: account not found."
                );
                return;
            }

            admin.setPassword(passwordEncoder.encode(adminPassword));
            userRepository.save(admin);

            System.out.println(
                    "Admin password updated successfully."
            );
        };
    }
}