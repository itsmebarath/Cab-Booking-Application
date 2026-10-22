package com.cabbooking.backend.controller;

import com.cabbooking.backend.dto.LoginRequest;
import com.cabbooking.backend.dto.LoginResponse;
import com.cabbooking.backend.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            HttpStatus status = e.getMessage().toLowerCase().contains("invalid email or password")
                    ? HttpStatus.UNAUTHORIZED
                    : HttpStatus.BAD_REQUEST;

            return ResponseEntity.status(status).body(Map.of("message", e.getMessage()));
        }
    }
}