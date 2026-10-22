package com.cabbooking.backend.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {

    public static void main(String[] args) {

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String hash = encoder.encode("123456");

        System.out.println("Generated BCrypt hash:");
        System.out.println(hash);

        System.out.println(
                "Password matches: " + encoder.matches("123456", hash)
        );
    }
}