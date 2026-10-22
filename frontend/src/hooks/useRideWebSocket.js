import { useEffect, useState, useCallback, useRef } from "react";
import webSocketService from "../services/websocket";

/**
 * Hook to monitor the live WebSocket connection status.
 */
export function useWebSocketStatus() {
  const [status, setStatus] = useState("DISCONNECTED");

  useEffect(() => {
    webSocketService.connect();
    const unsubscribe = webSocketService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    status,
    isConnected: status === "CONNECTED",
    isConnecting: status === "CONNECTING",
  };
}

/**
 * Hook for riders and drivers to track a specific ride's lifecycle and live GPS location stream.
 */
export function useRideTracking(rideId, onStatusChange, onLocationChange) {
  const [currentStatus, setCurrentStatus] = useState(null);
  const [driverCoordinates, setDriverCoordinates] = useState(null);
  const { status, isConnected } = useWebSocketStatus();

  const statusCallbackRef = useRef(onStatusChange);
  const locationCallbackRef = useRef(onLocationChange);

  useEffect(() => {
    statusCallbackRef.current = onStatusChange;
    locationCallbackRef.current = onLocationChange;
  }, [onStatusChange, onLocationChange]);

  useEffect(() => {
    if (!rideId) return;

    // 1. Subscribe to ride status transitions (REQUESTED -> ACCEPTED -> IN_PROGRESS -> COMPLETED/CANCELLED)
    const unsubStatus = webSocketService.subscribeToRide(rideId, (payload) => {
      if (payload?.status) {
        setCurrentStatus(payload.status);
      }
      if (statusCallbackRef.current) {
        statusCallbackRef.current(payload);
      }
    });

    // 2. Subscribe to driver GPS telemetry
    const unsubLocation = webSocketService.subscribeToRideLocation(rideId, (locationPayload) => {
      if (locationPayload?.latitude && locationPayload?.longitude) {
        setDriverCoordinates({
          latitude: locationPayload.latitude,
          longitude: locationPayload.longitude,
          speed: locationPayload.speed,
          heading: locationPayload.heading,
          timestamp: locationPayload.timestamp,
        });
      }
      if (locationCallbackRef.current) {
        locationCallbackRef.current(locationPayload);
      }
    });

    return () => {
      unsubStatus();
      unsubLocation();
    };
  }, [rideId]);

  return {
    currentStatus,
    driverCoordinates,
    wsConnected: isConnected,
    wsStatus: status,
  };
}

/**
 * Hook for drivers to receive instant targeted dispatch alerts and general ride requests.
 */
export function useDriverRideAlerts(driverId, onNewAlert) {
  const [latestAlert, setLatestAlert] = useState(null);
  const alertCallbackRef = useRef(onNewAlert);

  useEffect(() => {
    alertCallbackRef.current = onNewAlert;
  }, [onNewAlert]);

  const handleAlert = useCallback((payload) => {
    setLatestAlert(payload);
    if (alertCallbackRef.current) {
      alertCallbackRef.current(payload);
    }
  }, []);

  useEffect(() => {
    // 1. Listen for global available rides
    const unsubGlobal = webSocketService.subscribeToAvailableRides((payload) => {
      handleAlert({ type: "GLOBAL_AVAILABLE", data: payload });
    });

    // 2. Listen for driver-specific direct dispatches
    let unsubDriver = () => {};
    if (driverId) {
      unsubDriver = webSocketService.subscribeToDriverDispatches(driverId, (payload) => {
        handleAlert({ type: "DIRECT_DISPATCH", data: payload });
      });
    }

    return () => {
      unsubGlobal();
      unsubDriver();
    };
  }, [driverId, handleAlert]);

  return { latestAlert };
}
