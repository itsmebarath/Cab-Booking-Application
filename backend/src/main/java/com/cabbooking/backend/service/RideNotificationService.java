package com.cabbooking.backend.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class RideNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public RideNotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // 1. Broadcast ride lifecycle status changes
    public void sendRideStatusUpdate(Long rideId, String status, String message) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("rideId", rideId);
        notification.put("status", status);
        notification.put("message", message);
        notification.put("timestamp", LocalDateTime.now().toString());

        messagingTemplate.convertAndSend("/topic/rides/" + rideId, (Object) notification);
    }

    // 2. Broadcast live driver GPS location during an active trip
    public void sendDriverLocationUpdate(
            Long rideId,
            Long driverId,
            Double latitude,
            Double longitude,
            Double speed,
            Double heading) {

        Map<String, Object> locationPayload = new HashMap<>();
        locationPayload.put("rideId", rideId);
        locationPayload.put("driverId", driverId);
        locationPayload.put("latitude", latitude);
        locationPayload.put("longitude", longitude);
        locationPayload.put("speed", speed);
        locationPayload.put("heading", heading);
        locationPayload.put("timestamp", LocalDateTime.now().toString());

        messagingTemplate.convertAndSend("/topic/rides/" + rideId + "/location", (Object) locationPayload);
    }

    // 3. Dispatch new ride notification directly to a specific nearby driver
    public void sendRideDispatch(Long driverId, Map<String, Object> dispatchData) {
        messagingTemplate.convertAndSend("/topic/drivers/" + driverId + "/rides", (Object) dispatchData);
    }

    // 4. Broadcast newly available ride to all drivers
    public void sendBroadcastRideAvailable(Map<String, Object> rideData) {
        messagingTemplate.convertAndSend("/topic/rides/available", (Object) rideData);
    }
}