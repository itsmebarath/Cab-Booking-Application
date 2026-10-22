package com.cabbooking.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public class LoginResponse {

    @JsonProperty("token")
    private final String token;

    @JsonProperty("name")
    private final String name;

    @JsonProperty("email")
    private final String email;

    @JsonProperty("role")
    private final String role;

    @JsonProperty("userId")
    private final Long userId;

    @JsonProperty("driverId")
    private final Long driverId;

    public LoginResponse(
            String token,
            String name,
            String email,
            String role,
            Long userId,
            Long driverId) {

        this.token = token;
        this.name = name;
        this.email = email;
        this.role = role;
        this.userId = userId;
        this.driverId = driverId;
    }

    public LoginResponse(
            String token,
            String name,
            String email,
            String role,
            Long driverId) {

        this(token, name, email, role, null, driverId);
    }

    public String getToken() {
        return token;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getDriverId() {
        return driverId;
    }
}