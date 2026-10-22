package com.cabbooking.backend;

import com.cabbooking.backend.dto.DriverProfileResponse;
import com.cabbooking.backend.dto.LoginRequest;
import com.cabbooking.backend.dto.LoginResponse;
import com.cabbooking.backend.entity.Driver;
import com.cabbooking.backend.entity.Role;
import com.cabbooking.backend.entity.User;
import com.cabbooking.backend.repository.DriverRepository;
import com.cabbooking.backend.repository.UserRepository;
import com.cabbooking.backend.security.JwtService;
import com.cabbooking.backend.service.AuthService;
import com.cabbooking.backend.service.DriverService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthAndDriverFlowTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DriverRepository driverRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private DriverService driverService;

    private User driverUser;
    private User riderUser;
    private Driver driverEntity;

    @BeforeEach
    void setUp() {
        driverService = new DriverService(driverRepository, userRepository);

        driverUser = User.builder()
                .id(2L)
                .name("Driver John")
                .email("driver@example.com")
                .password("encoded_pass")
                .phone("9876543210")
                .role(Role.DRIVER)
                .createdAt(LocalDateTime.now())
                .build();

        riderUser = User.builder()
                .id(10L)
                .name("Rider Jane")
                .email("rider@example.com")
                .password("encoded_pass")
                .phone("9876543211")
                .role(Role.RIDER)
                .createdAt(LocalDateTime.now())
                .build();

        driverEntity = Driver.builder()
                .id(1L)
                .user(driverUser)
                .licenseNumber("DL123456789")
                .vehicleNumber("TN09AB1234")
                .vehicleModel("Toyota Prius")
                .available(true)
                .build();
    }

    @Test
    @DisplayName("Scenario A: DRIVER login with driver profile returns correct driverId and distinct userId")
    void testDriverLoginSuccess() {
        LoginRequest request = new LoginRequest();
        request.setEmail("driver@example.com");
        request.setPassword("plain_pass");

        when(userRepository.findByEmail("driver@example.com")).thenReturn(Optional.of(driverUser));
        when(passwordEncoder.matches("plain_pass", "encoded_pass")).thenReturn(true);
        when(jwtService.generateToken(driverUser)).thenReturn("mock_jwt_token");
        when(driverRepository.findByUserId(2L)).thenReturn(Optional.of(driverEntity));

        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock_jwt_token", response.getToken());
        assertEquals("Driver John", response.getName());
        assertEquals("driver@example.com", response.getEmail());
        assertEquals("DRIVER", response.getRole());
        assertEquals(2L, response.getUserId(), "userId must be User's id (2)");
        assertEquals(1L, response.getDriverId(), "driverId must be Driver's id (1), not User's id");
        assertNotEquals(response.getUserId(), response.getDriverId(), "Driver ID and User ID must remain distinct");
    }

    @Test
    @DisplayName("Scenario C: DRIVER login without driver profile throws clear error")
    void testDriverLoginWithoutProfile() {
        LoginRequest request = new LoginRequest();
        request.setEmail("driver@example.com");
        request.setPassword("plain_pass");

        when(userRepository.findByEmail("driver@example.com")).thenReturn(Optional.of(driverUser));
        when(passwordEncoder.matches("plain_pass", "encoded_pass")).thenReturn(true);
        when(jwtService.generateToken(driverUser)).thenReturn("mock_jwt_token");
        when(driverRepository.findByUserId(2L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> authService.login(request));
        assertTrue(exception.getMessage().contains("Driver profile not found"), "Error message must indicate missing driver profile");
    }

    @Test
    @DisplayName("Scenario D: Valid RIDER login succeeds with driverId = null")
    void testRiderLoginSuccess() {
        LoginRequest request = new LoginRequest();
        request.setEmail("rider@example.com");
        request.setPassword("plain_pass");

        when(userRepository.findByEmail("rider@example.com")).thenReturn(Optional.of(riderUser));
        when(passwordEncoder.matches("plain_pass", "encoded_pass")).thenReturn(true);
        when(jwtService.generateToken(riderUser)).thenReturn("mock_jwt_token");

        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("RIDER", response.getRole());
        assertEquals(10L, response.getUserId());
        assertNull(response.getDriverId(), "Riders should have driverId = null without errors");
        verify(driverRepository, never()).findByUserId(any());
    }

    @Test
    @DisplayName("Scenario E: Invalid password throws authentication exception")
    void testInvalidPassword() {
        LoginRequest request = new LoginRequest();
        request.setEmail("driver@example.com");
        request.setPassword("wrong_pass");

        when(userRepository.findByEmail("driver@example.com")).thenReturn(Optional.of(driverUser));
        when(passwordEncoder.matches("wrong_pass", "encoded_pass")).thenReturn(false);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> authService.login(request));
        assertEquals("Invalid email or password", exception.getMessage());
    }

    @Test
    @DisplayName("STEP 3: getMyProfile returns DriverProfileResponse with verified driverId and userId")
    void testGetMyProfileSuccess() {
        when(userRepository.findByEmail("driver@example.com")).thenReturn(Optional.of(driverUser));
        when(driverRepository.findByUserId(2L)).thenReturn(Optional.of(driverEntity));

        DriverProfileResponse profile = driverService.getMyProfile("driver@example.com");

        assertNotNull(profile);
        assertEquals(1L, profile.getDriverId());
        assertEquals(2L, profile.getUserId());
        assertEquals("TN09AB1234", profile.getVehicleNumber());
        assertEquals("Toyota Prius", profile.getVehicleModel());
        assertEquals("DL123456789", profile.getLicenseNumber());
        assertTrue(profile.isAvailable());
    }

    @Test
    @DisplayName("STEP 3: getMyProfile rejects non-driver users with 403 Forbidden")
    void testGetMyProfileNonDriverRejected() {
        when(userRepository.findByEmail("rider@example.com")).thenReturn(Optional.of(riderUser));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> driverService.getMyProfile("rider@example.com"));
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    @DisplayName("STEP 3: getMyProfile returns 404 when driver entity is missing")
    void testGetMyProfileNotFound() {
        when(userRepository.findByEmail("driver@example.com")).thenReturn(Optional.of(driverUser));
        when(driverRepository.findByUserId(2L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> driverService.getMyProfile("driver@example.com"));
        assertEquals(404, ex.getStatusCode().value());
    }

    @Test
    @DisplayName("JSON Serialization: LoginResponse serializes driverId correctly")
    void testLoginResponseJsonSerialization() throws Exception {
        LoginResponse response = new LoginResponse(
                "token123",
                "Driver Name",
                "driver@example.com",
                "DRIVER",
                2L,
                1L
        );

        ObjectMapper mapper = new ObjectMapper();
        String json = mapper.writeValueAsString(response);

        assertTrue(json.contains("\"driverId\":1"), "JSON must contain driverId: 1");
        assertTrue(json.contains("\"userId\":2"), "JSON must contain userId: 2");
        assertTrue(json.contains("\"role\":\"DRIVER\""), "JSON must contain role: DRIVER");
    }

    @Test
    @DisplayName("JSON Serialization: DriverProfileResponse serializes driverId, userId, and available correctly")
    void testDriverProfileResponseJsonSerialization() throws Exception {
        DriverProfileResponse profile = new DriverProfileResponse(
                1L,
                2L,
                "Driver Name",
                "driver@example.com",
                "TN09AB1234",
                "Toyota Prius",
                "DL123",
                true
        );

        ObjectMapper mapper = new ObjectMapper();
        String json = mapper.writeValueAsString(profile);

        assertTrue(json.contains("\"driverId\":1"), "JSON must contain driverId: 1");
        assertTrue(json.contains("\"userId\":2"), "JSON must contain userId: 2");
        assertTrue(json.contains("\"available\":true"), "JSON must contain available: true");
    }
}
