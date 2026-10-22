import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

import {
  ArrowRight,
  Bell,
  CarFront,
  CircleHelp,
  Clock3,
  LayoutDashboard,
  LogOut,
  MapPin,
  ShieldCheck,
  UserRound,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import LiveConnectionBadge from "../../components/common/LiveConnectionBadge";
import { useDriverRideAlerts } from "../../hooks/useRideWebSocket";

const isValidDriverId = (val) => {
  if (val === null || val === undefined) return false;
  const s = String(val).trim();
  if (!s || s === "null" || s === "undefined" || s === "NaN") return false;
  const n = Number(s);
  return Number.isInteger(n) && n > 0;
};

const getStoredDriverId = () => {
  const raw = localStorage.getItem("driverId");
  if (isValidDriverId(raw)) {
    return String(raw);
  }
  if (raw !== null) {
    localStorage.removeItem("driverId");
  }
  return null;
};

function DriverDashboard() {
  const navigate = useNavigate();

  const [driverName, setDriverName] = useState(
    localStorage.getItem("name") || "Driver"
  );
  const [driverEmail, setDriverEmail] = useState(
    localStorage.getItem("email") || ""
  );
  const driverRole = localStorage.getItem("role");

  // Driver identity and profile state
  const [driverId, setDriverId] = useState(getStoredDriverId);
  const [driverProfile, setDriverProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  // Ride states
  const [availableRides, setAvailableRides] = useState([]);
  const [myRides, setMyRides] = useState([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [rideError, setRideError] = useState("");
  const [acceptingRideId, setAcceptingRideId] = useState(null);
  const [actionLoadingRideId, setActionLoadingRideId] = useState(null);
  const [incomingRideAlert, setIncomingRideAlert] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    localStorage.removeItem("userId");
    localStorage.removeItem("driverId");

    navigate("/driver/login", { replace: true });
  }, [navigate]);

  const menuItems = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      active: true,
    },
    {
      label: "Available Rides",
      icon: MapPin,
      active: false,
    },
    {
      label: "My Rides",
      icon: CarFront,
      active: false,
    },
    {
      label: "Earnings",
      icon: Clock3,
      active: false,
    },
    {
      label: "Profile",
      icon: UserRound,
      active: false,
    },
  ];

  // 1. Load authenticated driver profile from GET /api/drivers/my-profile
  const fetchDriverProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      setProfileError("");

      const response = await api.get("/api/drivers/my-profile");
      const profile = response.data;

      if (!profile || !isValidDriverId(profile.driverId)) {
        throw new Error("Invalid profile response from server.");
      }

      const verifiedId = String(profile.driverId);
      setDriverProfile(profile);
      setDriverId(verifiedId);

      localStorage.setItem("driverId", verifiedId);
      if (profile.userId) {
        localStorage.setItem("userId", String(profile.userId));
      }
      if (profile.name) {
        setDriverName(profile.name);
        localStorage.setItem("name", profile.name);
      }
      if (profile.email) {
        setDriverEmail(profile.email);
        localStorage.setItem("email", profile.email);
      }

      return verifiedId;
    } catch (error) {
      console.error("Failed to load driver profile:", error);

      if (error.response?.status === 401) {
        logout();
        return null;
      }

      const message =
        error.response?.status === 404
          ? "Driver profile not found. Please complete your vehicle registration."
          : error.response?.data?.message ||
            error.message ||
            "Unable to load driver profile. Please try logging in again.";

      setProfileError(message);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, [logout]);

  // 2. Fetch all rides currently in REQUESTED status
  const fetchAvailableRides = useCallback(async () => {
    try {
      setRideError("");
      const response = await api.get("/api/rides/available");
      setAvailableRides(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Failed to load available rides:", error);

      if (error.response?.status === 401) {
        setRideError("Your session has expired. Please log in again.");
      } else if (error.response?.status === 403) {
        setRideError("You do not have permission to view available rides.");
      } else {
        setRideError("Unable to load available rides. Please refresh.");
      }
    } finally {
      setLoadingRides(false);
    }
  }, []);

  // 3. Fetch rides assigned to this driver using verified driverId
  const fetchMyRides = useCallback(async (targetDriverId) => {
    const rawId = targetDriverId || getStoredDriverId();

    if (!isValidDriverId(rawId)) {
      setMyRides([]);
      return;
    }

    const idToUse = String(rawId);

    try {
      const response = await api.get(`/api/rides/driver/${idToUse}`);
      setMyRides(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Failed to load driver rides:", error);
    }
  }, []);

  // Helper to resolve verified driver ID before driver actions
  const getOrResolveDriverId = useCallback(async () => {
    let activeDriverId = getStoredDriverId() || (isValidDriverId(driverId) ? String(driverId) : null);
    if (!activeDriverId) {
      activeDriverId = await fetchDriverProfile();
    }
    return isValidDriverId(activeDriverId) ? String(activeDriverId) : null;
  }, [driverId, fetchDriverProfile]);

  // Initial load and periodic refresh
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || driverRole !== "DRIVER") {
      navigate("/driver/login", { replace: true });
      return;
    }

    let isMounted = true;

    const initialize = async () => {
      // Step A: Load or verify driver profile
      let activeDriverId = getStoredDriverId();

      if (!activeDriverId) {
        activeDriverId = await fetchDriverProfile();
      } else {
        // Also fetch profile in background to update vehicle details
        fetchDriverProfile();
      }

      if (isMounted) {
        fetchAvailableRides();
        if (activeDriverId) {
          fetchMyRides(activeDriverId);
        }
      }
    };

    initialize();

    // Periodic refresh every 15 seconds
    const intervalId = window.setInterval(() => {
      if (!isMounted) return;
      fetchAvailableRides();
      const currentId = getStoredDriverId();
      if (currentId) {
        fetchMyRides(currentId);
      }
    }, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [driverRole, navigate, fetchDriverProfile, fetchAvailableRides, fetchMyRides]);

  // Real-Time STOMP WebSocket ride alert listener
  const handleIncomingAlert = useCallback((alert) => {
    console.log("⚡ Real-Time Ride Alert Received:", alert);
    setIncomingRideAlert(alert);
    fetchAvailableRides();
    const currentId = getStoredDriverId();
    if (currentId) {
      fetchMyRides(currentId);
    }
  }, [fetchAvailableRides, fetchMyRides]);

  useDriverRideAlerts(driverId, handleIncomingAlert);

  // Live driver location broadcaster
  useEffect(() => {
    if (!driverId) return;

    const pushLocation = async () => {
      try {
        let lat = 11.0180 + (Math.random() - 0.5) * 0.004;
        let lng = 76.9600 + (Math.random() - 0.5) * 0.004;

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              await api.put("/api/drivers/location", {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                speed: pos.coords.speed || 0,
                heading: pos.coords.heading || 0,
              }, { params: { driverId } });
            },
            async () => {
              await api.put("/api/drivers/location", {
                latitude: lat,
                longitude: lng,
                speed: 25,
                heading: 90,
              }, { params: { driverId } });
            },
            { timeout: 4000 }
          );
        }
      } catch (err) {
        // Non-blocking telemetry
      }
    };

    pushLocation();
    const locInterval = setInterval(pushLocation, 25000);
    return () => clearInterval(locInterval);
  }, [driverId]);

  // Accept a ride request
  const acceptRide = async (rideId) => {
    const activeDriverId = await getOrResolveDriverId();

    if (!activeDriverId) {
      setRideError(
        "Driver ID is missing. Driver profile could not be verified. Please log in again."
      );
      return;
    }

    try {
      setAcceptingRideId(rideId);
      setRideError("");

      await api.put(`/api/rides/${rideId}/accept`, null, {
        params: { driverId: activeDriverId },
      });

      await Promise.all([
        fetchAvailableRides(),
        fetchMyRides(activeDriverId),
      ]);

      window.alert("Ride accepted successfully!");
    } catch (error) {
      console.error("Failed to accept ride:", error);
      const message =
        error.response?.data?.message ||
        "Unable to accept this ride. It may have already been accepted by another driver.";
      setRideError(message);
    } finally {
      setAcceptingRideId(null);
    }
  };

  // Start an accepted ride
  const startRide = async (rideId) => {
    const activeDriverId = await getOrResolveDriverId();

    if (!activeDriverId) {
      setRideError("Driver ID is missing. Please log in again.");
      return;
    }

    try {
      setActionLoadingRideId(rideId);
      setRideError("");

      await api.put(`/api/rides/${rideId}/start`, null, {
        params: { driverId: activeDriverId },
      });

      await fetchMyRides(activeDriverId);
    } catch (error) {
      console.error("Failed to start ride:", error);
      setRideError(
        error.response?.data?.message || "Unable to start this ride."
      );
    } finally {
      setActionLoadingRideId(null);
    }
  };

  // Complete an in-progress ride
  const completeRide = async (rideId) => {
    const activeDriverId = await getOrResolveDriverId();

    if (!activeDriverId) {
      setRideError("Driver ID is missing. Please log in again.");
      return;
    }

    try {
      setActionLoadingRideId(rideId);
      setRideError("");

      await api.put(`/api/rides/${rideId}/complete`, null, {
        params: { driverId: activeDriverId },
      });

      await Promise.all([
        fetchMyRides(activeDriverId),
        fetchAvailableRides(),
        fetchDriverProfile(),
      ]);

      window.alert("Ride marked as completed!");
    } catch (error) {
      console.error("Failed to complete ride:", error);
      setRideError(
        error.response?.data?.message || "Unable to complete this ride."
      );
    } finally {
      setActionLoadingRideId(null);
    }
  };

  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  const toggleAvailability = async () => {
    try {
      setUpdatingAvailability(true);
      const newStatus = !driverProfile?.available;
      await api.put("/api/drivers/availability", { available: newStatus });
      setDriverProfile((prev) => (prev ? { ...prev, available: newStatus } : { available: newStatus }));
      if (newStatus) {
        fetchAvailableRides();
      }
    } catch (err) {
      console.error("Failed to update availability:", err);
      window.alert(err.response?.data?.message || "Failed to update availability status.");
    } finally {
      setUpdatingAvailability(false);
    }
  };

  if (!localStorage.getItem("token") || driverRole !== "DRIVER") {
    return null;
  }

  const completedRides = myRides.filter(
    (ride) => ride.status === "COMPLETED"
  );

  const totalEarnings = completedRides.reduce(
    (total, ride) => total + Number(ride.fare || 0),
    0
  );

  return (
    <main className="rf-driver-dashboard">
      {/* Sidebar */}
      <aside className="rf-driver-sidebar">
        <a href="/" className="rf-driver-brand">
          <span className="rf-driver-brand-icon">
            <CarFront size={25} />
          </span>

          <span>
            Ride<span>Flow</span>
          </span>
        </a>

        <div className="rf-driver-sidebar-label">WORKSPACE</div>

        <nav className="rf-driver-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                type="button"
                key={item.label}
                className={`rf-driver-nav-item ${
                  item.active ? "active" : ""
                }`}
                onClick={() => {
                  if (item.label === "Overview") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  } else if (item.label === "Available Rides") {
                    document
                      .getElementById("driver-available-rides")
                      ?.scrollIntoView({ behavior: "smooth" });
                  } else if (item.label === "My Rides") {
                    document
                      .getElementById("driver-my-rides")
                      ?.scrollIntoView({ behavior: "smooth" });
                  } else if (item.label === "Earnings") {
                    document
                      .getElementById("driver-earnings")
                      ?.scrollIntoView({ behavior: "smooth" });
                  } else if (item.label === "Profile") {
                    document
                      .getElementById("driver-profile")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                title={`Go to ${item.label}`}
              >
                <Icon size={19} />
                <span>{item.label}</span>

                {item.active && (
                  <span className="rf-driver-nav-indicator" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="rf-driver-sidebar-bottom">
          <div className="rf-driver-help-card">
            <span className="rf-driver-help-icon">
              <CircleHelp size={20} />
            </span>
            <h4>Need assistance?</h4>
            <p>24/7 Driver Partner Support is ready to assist you.</p>
          </div>

          <button
            type="button"
            className="rf-driver-logout"
            onClick={logout}
          >
            <LogOut size={19} />
            <span>Log out</span>
          </button>

          <div className="rf-driver-sidebar-footer">
            <ShieldCheck size={15} />
            RideFlow Driver Portal
          </div>
        </div>
      </aside>

      {/* Main content */}
      <section className="rf-driver-main">
        <header className="rf-driver-topbar">
          <div>
            <div className="rf-driver-breadcrumb">
              Workspace <span>/</span> Overview
            </div>
            <h2>Driver Dashboard</h2>
          </div>

          <div className="rf-driver-topbar-actions">
            <LiveConnectionBadge />

            <button
              type="button"
              className="rf-driver-icon-button"
              aria-label="Notifications"
              onClick={() => window.alert("You have no unread notifications.")}
            >
              <Bell size={19} />
              <span className="rf-driver-notification-dot" />
            </button>

            <div className="rf-driver-topbar-profile">
              <div className="rf-driver-avatar">
                {driverName.charAt(0).toUpperCase()}
              </div>

              <div className="rf-driver-profile-info">
                <strong>{driverName}</strong>
                <span>
                  {isValidDriverId(driverId) ? `Driver #${driverId}` : "Driver"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="rf-driver-content">
          {/* Real-time incoming ride dispatch banner */}
          {incomingRideAlert && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                marginBottom: "20px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                color: "#ffffff",
                boxShadow: "0 10px 25px -5px rgba(49, 46, 129, 0.4)",
                border: "1px solid rgba(129, 140, 248, 0.35)",
              }}
              role="alert"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: "rgba(99, 102, 241, 0.3)",
                    color: "#a5b4fc",
                    flexShrink: 0,
                  }}
                >
                  <CarFront size={22} />
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.98rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>
                      {incomingRideAlert.type === "DIRECT_DISPATCH"
                        ? "⚡ Direct Ride Dispatch Received!"
                        : "🔔 New Ride Request Available!"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        backgroundColor: "#10b981",
                        color: "#ffffff",
                      }}
                    >
                      LIVE
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
                    <strong>{incomingRideAlert.data?.pickupLocation}</strong> ➔ <strong>{incomingRideAlert.data?.dropLocation}</strong>
                    {incomingRideAlert.data?.fare && ` • ₹${incomingRideAlert.data.fare}`}
                    {incomingRideAlert.data?.distanceToPickupKm !== undefined &&
                      ` • ${incomingRideAlert.data.distanceToPickupKm} km away`}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  className="rf-driver-primary-button"
                  style={{ padding: "8px 18px", fontSize: "0.85rem", cursor: "pointer" }}
                  onClick={() => {
                    document.getElementById("driver-available-rides")?.scrollIntoView({ behavior: "smooth" });
                    setIncomingRideAlert(null);
                  }}
                >
                  View Ride
                </button>
                <button
                  type="button"
                  onClick={() => setIncomingRideAlert(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "4px 8px",
                    fontSize: "1.1rem",
                  }}
                  title="Dismiss notification"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Missing profile banner */}
          {profileError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px",
                background: "#fef2f2",
                border: "1px solid #f87171",
                borderRadius: "12px",
                color: "#991b1b",
                marginBottom: "20px",
              }}
              role="alert"
            >
              <AlertCircle size={22} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <strong>Driver Profile Warning:</strong> {profileError}
              </div>
              <button
                type="button"
                className="rf-driver-secondary-button"
                onClick={fetchDriverProfile}
                disabled={profileLoading}
                style={{ padding: "6px 12px", fontSize: "12px" }}
              >
                {profileLoading ? "Checking..." : "Retry"}
              </button>
            </div>
          )}

          {/* Welcome banner */}
          <section className="rf-driver-welcome">
            <div className="rf-driver-welcome-content">
              <span className="rf-driver-welcome-label">
                YOUR DRIVER WORKSPACE
              </span>

              <h1>
                Welcome back, {driverName.split(" ")[0]}!
              </h1>

              <p>
                View available ride requests, accept passenger trips, and track your completed journey earnings in real-time.
              </p>

              <div style={{ marginTop: "16px" }}>
                <button
                  type="button"
                  disabled={updatingAvailability}
                  onClick={toggleAvailability}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 18px",
                    borderRadius: "9999px",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    backgroundColor: driverProfile?.available ? "#10b981" : "#475569",
                    color: "#ffffff",
                    boxShadow: driverProfile?.available ? "0 0 12px rgba(16, 185, 129, 0.45)" : "none",
                    transition: "all 0.2s ease",
                  }}
                  title="Click to toggle your availability to accept ride requests"
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#ffffff",
                    }}
                  />
                  {updatingAvailability
                    ? "Updating..."
                    : driverProfile?.available
                    ? "Online • Ready for Rides (Tap to Go Offline)"
                    : "Offline • Unavailable (Tap to Go Online)"}
                </button>
              </div>
            </div>

            <div className="rf-driver-welcome-art">
              <div className="rf-driver-art-circle">
                <CarFront size={94} strokeWidth={1.25} />
              </div>

              <div className="rf-driver-art-pin">
                <MapPin size={22} />
              </div>
            </div>
          </section>

          {/* Statistics */}
          <section className="rf-driver-section">
            <div className="rf-driver-section-heading">
              <div>
                <h2>Your Overview</h2>
                <p>Real-time metrics for your driver account.</p>
              </div>
            </div>

            <div className="rf-driver-stats">
              <article className="rf-driver-stat-card">
                <div className="rf-driver-stat-top">
                  <span className="rf-driver-stat-icon blue">
                    <CarFront size={21} />
                  </span>
                  <span className="rf-driver-stat-tag">
                    Assigned Rides
                  </span>
                </div>

                <h3>{myRides.length}</h3>
                <p>Total Rides</p>
                <span className="rf-driver-stat-note">
                  Assigned to your driver ID
                </span>
              </article>

              <article className="rf-driver-stat-card">
                <div className="rf-driver-stat-top">
                  <span className="rf-driver-stat-icon green">
                    <ShieldCheck size={21} />
                  </span>
                  <span className="rf-driver-stat-tag">
                    Completed
                  </span>
                </div>

                <h3>{completedRides.length}</h3>
                <p>Completed Trips</p>
                <span className="rf-driver-stat-note">
                  Successfully delivered
                </span>
              </article>

              <article
                className="rf-driver-stat-card"
                id="driver-earnings"
              >
                <div className="rf-driver-stat-top">
                  <span className="rf-driver-stat-icon purple">
                    <Clock3 size={21} />
                  </span>
                  <span className="rf-driver-stat-tag">
                    Earnings
                  </span>
                </div>

                <h3>₹{totalEarnings.toFixed(2)}</h3>
                <p>Total Revenue</p>
                <span className="rf-driver-stat-note">
                  Sum of completed trip fares
                </span>
              </article>
            </div>
          </section>

          {/* Available rides */}
          <section
            className="rf-driver-section"
            id="driver-available-rides"
          >
            <div className="rf-driver-section-heading">
              <div>
                <h2>Available Rides</h2>
                <p>Incoming ride requests awaiting driver acceptance.</p>
              </div>

              <button
                type="button"
                className="rf-driver-secondary-button"
                onClick={fetchAvailableRides}
                disabled={loadingRides}
              >
                <RefreshCw
                  size={16}
                  className={loadingRides ? "rf-spin" : ""}
                />
                {loadingRides ? "Loading..." : "Refresh"}
              </button>
            </div>

            {rideError && (
              <p role="alert" style={{ color: "#dc2626", fontWeight: "600" }}>
                {rideError}
              </p>
            )}

            {loadingRides ? (
              <p>Scanning for nearby ride requests...</p>
            ) : availableRides.length === 0 ? (
              <div
                style={{
                  padding: "36px",
                  textAlign: "center",
                  background: "#fff",
                  borderRadius: "14px",
                  border: "1px dashed #e2e8f0",
                }}
              >
                <CarFront size={40} style={{ color: "#94a3b8", marginBottom: "8px" }} />
                <h4 style={{ margin: "0 0 4px", color: "#1e293b" }}>No requests waiting right now</h4>
                <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
                  When riders in your area request a cab, they will appear here automatically.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {availableRides.map((ride) => (
                  <article
                    key={ride.id}
                    className="rf-driver-stat-card"
                    style={{ position: "relative" }}
                  >
                    <div className="rf-driver-stat-top">
                      <h3>Ride #{ride.id}</h3>
                      <span className="rf-driver-stat-tag" style={{ background: "#fef3c7", color: "#b45309" }}>
                        {ride.status}
                      </span>
                    </div>

                    <p style={{ margin: "6px 0" }}>
                      <strong>Pickup:</strong> {ride.pickupLocation}
                    </p>

                    <p style={{ margin: "6px 0" }}>
                      <strong>Destination:</strong> {ride.dropLocation}
                    </p>

                    <p style={{ margin: "6px 0", fontSize: "16px" }}>
                      <strong>Fare:</strong> ₹{Number(ride.fare).toFixed(2)}
                    </p>

                    <p style={{ margin: "6px 0", color: "#64748b" }}>
                      <strong>Passenger:</strong> {ride.rider?.name || "Rider"}
                    </p>

                    <button
                      type="button"
                      className="rf-btn rf-btn-primary rf-btn-md"
                      style={{ marginTop: "12px", width: "100%", maxWidth: "200px" }}
                      disabled={
                        acceptingRideId === ride.id ||
                        ride.status !== "REQUESTED" ||
                        (!isValidDriverId(driverId) && !profileLoading)
                      }
                      onClick={() => acceptRide(ride.id)}
                    >
                      {acceptingRideId === ride.id ? "Accepting..." : "Accept Ride"}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* My rides */}
          <section
            className="rf-driver-section"
            id="driver-my-rides"
          >
            <div className="rf-driver-section-heading">
              <div>
                <h2>My Assigned Rides</h2>
                <p>Active and past trips assigned to Driver #{isValidDriverId(driverId) ? driverId : "—"}.</p>
              </div>
            </div>

            {myRides.length === 0 ? (
              <div
                style={{
                  padding: "36px",
                  textAlign: "center",
                  background: "#fff",
                  borderRadius: "14px",
                  border: "1px dashed #e2e8f0",
                }}
              >
                <CheckCircle2 size={40} style={{ color: "#94a3b8", marginBottom: "8px" }} />
                <h4 style={{ margin: "0 0 4px", color: "#1e293b" }}>No trips assigned yet</h4>
                <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
                  Accept an available ride request from above to begin your trip.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {myRides.map((ride) => {
                  const isAccepted = ride.status === "ACCEPTED";
                  const isInProgress = ride.status === "IN_PROGRESS";
                  const isCompleted = ride.status === "COMPLETED";

                  return (
                    <article
                      key={ride.id}
                      className="rf-driver-stat-card"
                    >
                      <div className="rf-driver-stat-top">
                        <h3>Ride #{ride.id}</h3>
                        <span
                          className="rf-driver-stat-tag"
                          style={{
                            background: isCompleted ? "#dcfce7" : isInProgress ? "#e0f2fe" : "#fef3c7",
                            color: isCompleted ? "#15803d" : isInProgress ? "#0369a1" : "#b45309",
                          }}
                        >
                          {ride.status}
                        </span>
                      </div>

                      <p style={{ margin: "6px 0" }}>
                        <strong>Pickup:</strong> {ride.pickupLocation}
                      </p>

                      <p style={{ margin: "6px 0" }}>
                        <strong>Destination:</strong> {ride.dropLocation}
                      </p>

                      <p style={{ margin: "6px 0" }}>
                        <strong>Fare:</strong> ₹{Number(ride.fare).toFixed(2)}
                      </p>

                      <p style={{ margin: "6px 0", color: "#64748b" }}>
                        <strong>Rider:</strong> {ride.rider?.name || "Rider"}
                      </p>

                      {isAccepted && (
                        <button
                          type="button"
                          className="rf-btn rf-btn-primary rf-btn-md"
                          style={{ marginTop: "10px", maxWidth: "200px" }}
                          disabled={actionLoadingRideId === ride.id}
                          onClick={() => startRide(ride.id)}
                        >
                          {actionLoadingRideId === ride.id ? "Starting..." : "Start Ride"}
                        </button>
                      )}

                      {isInProgress && (
                        <button
                          type="button"
                          className="rf-btn rf-btn-primary rf-btn-md"
                          style={{ marginTop: "10px", maxWidth: "200px", background: "#16a34a", color: "#fff" }}
                          disabled={actionLoadingRideId === ride.id}
                          onClick={() => completeRide(ride.id)}
                        >
                          {actionLoadingRideId === ride.id ? "Completing..." : "Complete Ride"}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Profile */}
          <section
            className="rf-driver-section"
            id="driver-profile"
          >
            <div className="rf-driver-section-heading">
              <div>
                <h2>Driver Profile & Vehicle</h2>
                <p>Your verified credentials and vehicle details.</p>
              </div>
            </div>

            <div className="rf-driver-getting-started">
              <div className="rf-driver-start-icon">
                <UserRound size={23} />
              </div>

              <div className="rf-driver-start-content">
                <h3>{driverName}</h3>
                <p>{driverEmail || "Email not available"}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" }}>
                  <span className="rf-driver-email">
                    <ShieldCheck size={15} />
                    Driver ID: #{isValidDriverId(driverId) ? driverId : "Pending"}
                  </span>
                  {driverProfile?.vehicleModel && (
                    <span className="rf-driver-email">
                      <CarFront size={15} />
                      {driverProfile.vehicleModel} ({driverProfile.vehicleNumber})
                    </span>
                  )}
                  {driverProfile?.licenseNumber && (
                    <span className="rf-driver-email">
                      Lic: {driverProfile.licenseNumber}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="rf-driver-secondary-button"
                onClick={fetchDriverProfile}
                disabled={profileLoading}
              >
                <RefreshCw size={15} />
                {profileLoading ? "Refreshing..." : "Refresh Profile"}
              </button>
            </div>
          </section>

          {/* Footer */}
          <footer className="rf-driver-footer">
            <span>© {new Date().getFullYear()} RideFlow</span>
            <span>Every journey matters.</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default DriverDashboard;