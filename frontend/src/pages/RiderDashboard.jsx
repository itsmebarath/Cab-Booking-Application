import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import LiveConnectionBadge from "../components/common/LiveConnectionBadge";
import { useRideTracking } from "../hooks/useRideWebSocket";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CarFront,
  Clock3,
  Headphones,
  MapPin,
  Navigation,
  ShieldCheck,
  Wallet,
  LogOut,
  UserRound,
  ChevronRight,
  Sparkles,
  Phone,
  XCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

function RiderDashboard() {
  const navigate = useNavigate();

  const name = localStorage.getItem("name") || "Rider";
  const email = localStorage.getItem("email") || "";

  const [activeRide, setActiveRide] = useState(null);
  const [activeRideLoading, setActiveRideLoading] = useState(true);
  const [rideHistory, setRideHistory] = useState([]);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (
      !localStorage.getItem("token") ||
      localStorage.getItem("role") !== "RIDER"
    ) {
      navigate("/rider/login", { replace: true });
    }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    localStorage.removeItem("userId");

    navigate("/rider/login", { replace: true });
  };

  // 1. Fetch current active ride
  const fetchActiveRide = useCallback(async () => {
    try {
      setActiveRideLoading(true);
      const res = await api.get("/api/rides/active/rider");
      if (res.status === 200 && res.data) {
        setActiveRide(res.data);
      } else {
        setActiveRide(null);
      }
    } catch (err) {
      console.error("Failed to load active ride:", err);
      setActiveRide(null);
    } finally {
      setActiveRideLoading(false);
    }
  }, []);

  // 2. Fetch completed ride history for stats
  const fetchRideHistory = useCallback(async () => {
    try {
      const res = await api.get("/api/rides/history");
      if (Array.isArray(res.data)) {
        setRideHistory(res.data);
      }
    } catch (err) {
      console.error("Failed to load ride history:", err);
    }
  }, []);

  useEffect(() => {
    fetchActiveRide();
    fetchRideHistory();
  }, [fetchActiveRide, fetchRideHistory]);

  // 3. Real-time STOMP WebSocket tracking of the active ride
  const handleRideStatusChange = useCallback(
    (payload) => {
      console.log("⚡ Rider received live ride update:", payload);
      if (payload.status === "COMPLETED") {
        window.alert("🎉 Your journey has completed! Thank you for riding with RideFlow.");
        setActiveRide(null);
        fetchRideHistory();
      } else if (payload.status === "CANCELLED") {
        window.alert("Your ride has been cancelled.");
        setActiveRide(null);
        fetchRideHistory();
      } else {
        // Refresh active ride details (e.g. driver assigned or trip started)
        fetchActiveRide();
      }
    },
    [fetchActiveRide, fetchRideHistory]
  );

  const handleDriverLocation = useCallback((loc) => {
    console.log("📍 Live driver GPS telemetry:", loc);
  }, []);

  const { driverCoordinates } = useRideTracking(
    activeRide?.id,
    handleRideStatusChange,
    handleDriverLocation
  );

  // 4. Cancel active ride
  const cancelActiveRide = async () => {
    if (!activeRide) return;
    const confirmCancel = window.confirm("Are you sure you want to cancel this ride?");
    if (!confirmCancel) return;

    try {
      setCancelling(true);
      await api.put(`/api/rides/${activeRide.id}/cancel`, {
        reason: "Cancelled by rider from dashboard",
      });
      setActiveRide(null);
      fetchRideHistory();
      window.alert("Ride cancelled successfully.");
    } catch (err) {
      console.error("Failed to cancel ride:", err);
      window.alert(err.response?.data?.message || "Failed to cancel ride.");
    } finally {
      setCancelling(false);
    }
  };

  const goToBooking = () => {
    navigate("/booking");
  };

  const completedRides = rideHistory.filter((r) => r.status === "COMPLETED");
  const totalSpent = completedRides.reduce(
    (acc, r) => acc + Number(r.fare || 0),
    0
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case "REQUESTED":
        return {
          label: "Finding Nearest Driver...",
          color: "#d97706",
          bg: "rgba(245, 158, 11, 0.12)",
          border: "rgba(245, 158, 11, 0.3)",
        };
      case "ACCEPTED":
        return {
          label: "Driver Confirmed & En Route",
          color: "#2563eb",
          bg: "rgba(37, 99, 235, 0.12)",
          border: "rgba(37, 99, 235, 0.3)",
        };
      case "IN_PROGRESS":
        return {
          label: "Trip In Progress",
          color: "#059669",
          bg: "rgba(16, 185, 129, 0.12)",
          border: "rgba(16, 185, 129, 0.3)",
        };
      default:
        return {
          label: status,
          color: "#475569",
          bg: "rgba(100, 116, 139, 0.12)",
          border: "rgba(100, 116, 139, 0.3)",
        };
    }
  };

  return (
    <div className="rf-rider-dashboard">
      {/* Sidebar */}
      <aside className="rf-rider-sidebar">
        <a href="/" className="rf-rider-brand">
          <span className="rf-rider-brand-icon">
            <CarFront size={25} />
          </span>

          <span>
            <strong>RideFlow</strong>
            <small>YOUR RIDE, YOUR WAY</small>
          </span>
        </a>

        <div className="rf-rider-sidebar-section">
          <p className="rf-rider-sidebar-label">MENU</p>

          <button
            className="rf-rider-nav-item active"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <span className="rf-rider-nav-icon">
              <CarFront size={19} />
            </span>
            <span>Overview</span>
          </button>

          <button className="rf-rider-nav-item" onClick={goToBooking}>
            <span className="rf-rider-nav-icon">
              <CalendarDays size={19} />
            </span>
            <span>Book a Ride</span>
            <ChevronRight size={16} className="rf-rider-nav-arrow" />
          </button>

          <button
            className="rf-rider-nav-item"
            onClick={() => {
              document
                .getElementById("rider-stats-section")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span className="rf-rider-nav-icon">
              <Clock3 size={19} />
            </span>
            <span>My Rides</span>
          </button>

          <button
            className="rf-rider-nav-item"
            onClick={() => {
              document
                .getElementById("rider-profile-section")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span className="rf-rider-nav-icon">
              <UserRound size={19} />
            </span>
            <span>My Profile</span>
          </button>
        </div>

        <div className="rf-rider-sidebar-spacer" />

        <div className="rf-rider-sidebar-help">
          <div className="rf-rider-help-icon">
            <Headphones size={21} />
          </div>

          <h3>Need a hand?</h3>
          <p>We're here to help with your ride experience.</p>

          <button
            onClick={() =>
              alert("RideFlow 24/7 Support: support@rideflow.com or +91 98765 43210")
            }
          >
            Get Support <ArrowRight size={15} />
          </button>
        </div>

        <button className="rf-rider-logout" onClick={logout}>
          <LogOut size={19} />
          <span>Log out</span>
        </button>

        <div className="rf-rider-sidebar-footer">© 2026 RideFlow</div>
      </aside>

      {/* Main Content */}
      <main className="rf-rider-main">
        {/* Topbar */}
        <header className="rf-rider-topbar">
          <div>
            <p className="rf-rider-breadcrumb">
              Dashboard <ChevronRight size={14} /> Overview
            </p>
          </div>

          <div className="rf-rider-topbar-right">
            <LiveConnectionBadge />

            <button
              className="rf-rider-notification"
              aria-label="Notifications"
              onClick={() =>
                alert("You have no new unread notifications.")
              }
            >
              <Bell size={20} />
              <span />
            </button>

            <div className="rf-rider-profile">
              <div className="rf-rider-avatar">
                {name.charAt(0).toUpperCase()}
              </div>

              <div className="rf-rider-profile-info">
                <strong>{name}</strong>
                <span>Rider account</span>
              </div>
            </div>
          </div>
        </header>

        <div className="rf-rider-content">
          {/* Real-Time Active Journey Card */}
          {activeRide && (
            <section
              style={{
                marginBottom: "28px",
                padding: "24px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                boxShadow: "0 20px 35px -10px rgba(15, 23, 42, 0.4)",
                border: "1px solid rgba(148, 163, 184, 0.15)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      color: "#94a3b8",
                      fontWeight: 600,
                    }}
                  >
                    LIVE ACTIVE JOURNEY • #{activeRide.id}
                  </span>
                  <h2 style={{ fontSize: "1.4rem", margin: "4px 0 0 0", color: "#f8fafc" }}>
                    {activeRide.vehicleCategory || "Sedan"} Ride
                  </h2>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {(() => {
                    const badge = getStatusBadge(activeRide.status);
                    return (
                      <span
                        style={{
                          padding: "6px 14px",
                          borderRadius: "9999px",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            backgroundColor: badge.color,
                          }}
                        />
                        {badge.label}
                      </span>
                    );
                  })()}

                  {(activeRide.status === "REQUESTED" ||
                    activeRide.status === "ACCEPTED") && (
                    <button
                      type="button"
                      disabled={cancelling}
                      onClick={cancelActiveRide}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "10px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        backgroundColor: "rgba(239, 68, 68, 0.15)",
                        color: "#f87171",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        cursor: "pointer",
                      }}
                    >
                      {cancelling ? "Cancelling..." : "Cancel Ride"}
                    </button>
                  )}
                </div>
              </div>

              {/* Route & Driver details grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "20px",
                  marginTop: "20px",
                }}
              >
                {/* Route points */}
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    padding: "16px",
                    borderRadius: "12px",
                  }}
                >
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "14px" }}>
                    <span
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: "#10b981",
                        marginTop: "4px",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase" }}>
                        PICKUP
                      </span>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.95rem", fontWeight: 500 }}>
                        {activeRide.pickupLocation}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <MapPin size={14} color="#f43f5e" style={{ marginTop: "4px", flexShrink: 0 }} />
                    <div>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase" }}>
                        DESTINATION
                      </span>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.95rem", fontWeight: 500 }}>
                        {activeRide.dropLocation}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "16px",
                      paddingTop: "12px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                      fontSize: "0.85rem",
                      color: "#94a3b8",
                    }}
                  >
                    <span>Estimated Fare</span>
                    <strong style={{ color: "#38bdf8", fontSize: "1.05rem" }}>
                      ₹{activeRide.fare}
                    </strong>
                  </div>
                </div>

                {/* Driver information */}
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    padding: "16px",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  {activeRide.driver ? (
                    <div>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase" }}>
                        ASSIGNED DRIVER
                      </span>
                      <h3 style={{ margin: "6px 0 2px 0", fontSize: "1.1rem" }}>
                        {activeRide.driver.user?.name || "Driver Partner"}
                      </h3>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1" }}>
                        {activeRide.driver.vehicleModel} •{" "}
                        <strong style={{ color: "#38bdf8" }}>
                          {activeRide.driver.vehicleNumber}
                        </strong>
                      </p>

                      {activeRide.driver.user?.phone && (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            marginTop: "10px",
                            fontSize: "0.82rem",
                            color: "#94a3b8",
                          }}
                        >
                          <Phone size={13} /> {activeRide.driver.user.phone}
                        </div>
                      )}

                      {driverCoordinates && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(56, 189, 248, 0.1)",
                            color: "#38bdf8",
                            fontSize: "0.8rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Navigation size={14} />
                          <span>
                            Driver moving live: Lat {driverCoordinates.latitude.toFixed(4)}, Lng{" "}
                            {driverCoordinates.longitude.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "16px 0" }}>
                      <CarFront size={36} color="#94a3b8" style={{ marginBottom: "8px" }} />
                      <p style={{ margin: 0, fontSize: "0.95rem", color: "#e2e8f0" }}>
                        Searching for the best driver near you...
                      </p>
                      <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                        Nearby drivers are receiving your request
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: "12px",
                      fontSize: "0.75rem",
                      color: "#64748b",
                      textAlign: "right",
                    }}
                  >
                    Live WebSocket Stream Connected
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Welcome */}
          <section className="rf-rider-welcome">
            <div className="rf-rider-welcome-content">
              <span className="rf-rider-welcome-tag">
                <Sparkles size={15} /> YOUR JOURNEY STARTS HERE
              </span>

              <h1>
                Welcome back, <span>{name.split(" ")[0]}!</span>
              </h1>

              <p>
                Wherever life takes you, let's get you there comfortably and on time.
              </p>

              <button className="rf-rider-primary-button" onClick={goToBooking}>
                Book a ride <ArrowRight size={18} />
              </button>
            </div>

            <div className="rf-rider-welcome-art">
              <div className="rf-rider-art-circle rf-rider-art-circle-one" />
              <div className="rf-rider-art-circle rf-rider-art-circle-two" />

              <div className="rf-rider-car-illustration">
                <div className="rf-rider-car-glow" />
                <CarFront size={145} strokeWidth={1.15} />
              </div>

              <div className="rf-rider-art-location">
                <MapPin size={16} />
                Your next destination
              </div>
            </div>
          </section>

          {/* Statistics */}
          <section id="rider-stats-section" className="rf-rider-stats">
            <article className="rf-rider-stat-card">
              <div className="rf-rider-stat-icon blue">
                <CarFront size={22} />
              </div>

              <div>
                <p>Total rides</p>
                <h2>{rideHistory.length}</h2>
                <span>
                  {completedRides.length} completed trips
                </span>
              </div>
            </article>

            <article className="rf-rider-stat-card">
              <div className="rf-rider-stat-icon purple">
                <Wallet size={22} />
              </div>

              <div>
                <p>Total spent</p>
                <h2>₹{totalSpent.toFixed(2)}</h2>
                <span>Across all completed rides</span>
              </div>
            </article>

            <article className="rf-rider-stat-card">
              <div className="rf-rider-stat-icon green">
                <ShieldCheck size={22} />
              </div>

              <div>
                <p>Account status</p>
                <h2 className="rf-rider-account-status">Active</h2>
                <span>Verified rider account</span>
              </div>
            </article>
          </section>

          {/* Booking Section */}
          <section className="rf-rider-booking-section">
            <div className="rf-rider-section-heading">
              <div>
                <h2>Where would you like to go?</h2>
                <p>Your next trip is just a few steps away.</p>
              </div>

              <span className="rf-rider-booking-badge">
                <Navigation size={15} /> Easy booking
              </span>
            </div>

            <div className="rf-rider-booking-card">
              <div className="rf-rider-route-visual">
                <div className="rf-rider-route-point pickup">
                  <span />
                </div>

                <div className="rf-rider-route-line" />

                <div className="rf-rider-route-point destination">
                  <MapPin size={17} />
                </div>
              </div>

              <div className="rf-rider-route-details">
                <div>
                  <span>YOUR PICKUP</span>
                  <h3>Where are you?</h3>
                  <p>Choose your pickup location when booking.</p>
                </div>

                <div className="rf-rider-route-divider" />

                <div>
                  <span>YOUR DESTINATION</span>
                  <h3>Where to?</h3>
                  <p>Enter your destination to plan your trip.</p>
                </div>
              </div>

              <button className="rf-rider-booking-button" onClick={goToBooking}>
                Start booking <ArrowRight size={17} />
              </button>
            </div>
          </section>

          {/* Bottom Cards */}
          <section id="rider-profile-section" className="rf-rider-bottom-grid">
            <article className="rf-rider-info-card">
              <div className="rf-rider-info-card-heading">
                <div className="rf-rider-info-icon">
                  <ShieldCheck size={22} />
                </div>

                <span className="rf-rider-info-label">RIDE WITH CONFIDENCE</span>
              </div>

              <h3>Your safety matters</h3>

              <p>
                Every RideFlow driver is verified with vehicle inspections and license authentication.
                Share trip details live with trusted contacts.
              </p>

              <button
                onClick={() =>
                  alert("RideFlow safety: SOS emergency trigger and 24/7 route tracking active.")
                }
              >
                Explore safety features <ArrowRight size={16} />
              </button>
            </article>

            <article className="rf-rider-info-card rf-rider-account-info">
              <div className="rf-rider-info-card-heading">
                <div className="rf-rider-info-icon purple">
                  <UserRound size={22} />
                </div>

                <span className="rf-rider-info-label">YOUR ACCOUNT</span>
              </div>

              <h3>Profile information</h3>

              <div className="rf-rider-account-detail">
                <span>Full name</span>
                <strong>{name}</strong>
              </div>

              <div className="rf-rider-account-detail">
                <span>Email address</span>
                <strong>{email || "Not provided"}</strong>
              </div>

              <button
                onClick={() =>
                  alert("Profile settings: You are logged in as " + email)
                }
              >
                Manage profile <ArrowRight size={16} />
              </button>
            </article>
          </section>

          <footer className="rf-rider-dashboard-footer">
            <span>© 2026 RideFlow. Made for smoother journeys.</span>
            <span>
              <span className="rf-rider-footer-dot" /> All systems ready
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default RiderDashboard;