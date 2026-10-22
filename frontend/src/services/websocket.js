import { Client } from "@stomp/stompjs";

// Determine WebSocket URL based on current host or environment
const getWebSocketUrl = () => {
  const isHttps = window.location.protocol === "https:";
  const protocol = isHttps ? "wss:" : "ws:";
  const hostname = window.location.hostname || "localhost";
  const port = "8080";
  return `${protocol}//${hostname}:${port}/ws`;
};

class WebSocketService {
  constructor() {
    this.client = null;
    this.status = "DISCONNECTED"; // 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'
    this.statusListeners = new Set();
    this.activeSubscriptions = new Map();
  }

  // Register listener for connection state updates
  onStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  _setStatus(newStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((callback) => {
        try {
          callback(newStatus);
        } catch (err) {
          console.error("Error in WS status listener:", err);
        }
      });
    }
  }

  // Connect to STOMP Broker
  connect() {
    if (this.client && (this.status === "CONNECTED" || this.status === "CONNECTING")) {
      return;
    }

    this._setStatus("CONNECTING");

    const token = localStorage.getItem("token");
    const connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    this.client = new Client({
      brokerURL: getWebSocketUrl(),
      connectHeaders,
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => {
        if (import.meta.env.DEV) {
          // console.debug("[STOMP]", str);
        }
      },
      onConnect: () => {
        console.log("🟢 WebSocket Connected to RideFlow STOMP Broker");
        this._setStatus("CONNECTED");

        // Resubscribe active subscriptions upon reconnect
        this.activeSubscriptions.forEach((subData, key) => {
          this._createStompSubscription(key, subData.topic, subData.callback);
        });
      },
      onDisconnect: () => {
        console.log("🔴 WebSocket Disconnected");
        this._setStatus("DISCONNECTED");
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers?.["message"]);
        this._setStatus("DISCONNECTED");
      },
      onWebSocketClose: () => {
        this._setStatus("DISCONNECTED");
      },
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this._setStatus("DISCONNECTED");
    }
    this.activeSubscriptions.clear();
  }

  _createStompSubscription(key, topic, callback) {
    if (!this.client || !this.client.connected) {
      return;
    }

    try {
      const stompSub = this.client.subscribe(topic, (message) => {
        try {
          const payload = JSON.parse(message.body);
          callback(payload);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
          callback(message.body);
        }
      });

      const entry = this.activeSubscriptions.get(key);
      if (entry) {
        entry.stompSub = stompSub;
      }
    } catch (err) {
      console.error(`Failed to subscribe to ${topic}:`, err);
    }
  }

  // Subscribe to a generic topic
  subscribe(topic, callback) {
    const key = `${topic}_${Math.random().toString(36).substring(2, 9)}`;

    this.activeSubscriptions.set(key, {
      topic,
      callback,
      stompSub: null,
    });

    if (this.status === "CONNECTED" && this.client?.connected) {
      this._createStompSubscription(key, topic, callback);
    } else {
      this.connect();
    }

    return () => {
      const entry = this.activeSubscriptions.get(key);
      if (entry?.stompSub) {
        try {
          entry.stompSub.unsubscribe();
        } catch (err) {
          console.error("Error unsubscribing:", err);
        }
      }
      this.activeSubscriptions.delete(key);
    };
  }

  // 1. Subscribe to ride status updates
  subscribeToRide(rideId, callback) {
    if (!rideId) return () => {};
    return this.subscribe(`/topic/rides/${rideId}`, callback);
  }

  // 2. Subscribe to live driver GPS location updates for a trip
  subscribeToRideLocation(rideId, callback) {
    if (!rideId) return () => {};
    return this.subscribe(`/topic/rides/${rideId}/location`, callback);
  }

  // 3. Subscribe to driver-specific direct dispatches
  subscribeToDriverDispatches(driverId, callback) {
    if (!driverId) return () => {};
    return this.subscribe(`/topic/drivers/${driverId}/rides`, callback);
  }

  // 4. Subscribe to newly available rides (global driver channel)
  subscribeToAvailableRides(callback) {
    return this.subscribe("/topic/rides/available", callback);
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;
