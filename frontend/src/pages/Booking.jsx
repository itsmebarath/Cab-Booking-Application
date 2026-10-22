import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import LiveConnectionBadge from "../components/common/LiveConnectionBadge";
import {
  CarFront,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  ShieldCheck,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Loader2,
  Bike,
} from "lucide-react";

// Predefined city landmarks with accurate coordinates
const POPULAR_LOCATIONS = [
  { name: "Gandhipuram Bus Stand", lat: 11.0168, lng: 76.9558 },
  { name: "Coimbatore Railway Junction", lat: 10.9980, lng: 76.9634 },
  { name: "RS Puram", lat: 11.0089, lng: 76.9452 },
  { name: "Peelamedu (PSG Tech)", lat: 11.0267, lng: 77.0028 },
  { name: "Coimbatore Airport (CJB)", lat: 11.0300, lng: 77.0434 },
  { name: "Tidel Park Coimbatore", lat: 11.0255, lng: 77.0270 },
  { name: "Brookefields Mall", lat: 11.0116, lng: 76.9585 },
  { name: "Saravanampatti Tech Zone", lat: 11.0827, lng: 76.9961 },
];

// Helper to compute distance locally using Haversine
const computeDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

export default function Booking() {
  const navigate = useNavigate();

  const riderName = localStorage.getItem("name") || "Rider";
  const [pickup, setPickup] = useState(POPULAR_LOCATIONS[0].name);
  const [drop, setDrop] = useState(POPULAR_LOCATIONS[4].name);
  const [selectedCategory, setSelectedCategory] = useState("SEDAN");
  const [distanceKm, setDistanceKm] = useState(9.7);
  const [durationMinutes, setDurationMinutes] = useState(20);

  const [fareEstimates, setFareEstimates] = useState([]);
  const [loadingEstimates, setLoadingEstimates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeRideConflict, setActiveRideConflict] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "RIDER") {
      navigate("/rider/login", { replace: true });
    }
  }, [navigate]);

  // Check if rider already has an active ride
  useEffect(() => {
    const checkActiveRide = async () => {
      try {
        const res = await api.get("/api/rides/active/rider");
        if (res.status === 200 && res.data) {
          setActiveRideConflict(res.data);
        }
      } catch (err) {
        // No active ride
      }
    };
    checkActiveRide();
  }, []);

  // Update distance whenever pickup or drop location changes
  useEffect(() => {
    const loc1 = POPULAR_LOCATIONS.find((l) => l.name === pickup);
    const loc2 = POPULAR_LOCATIONS.find((l) => l.name === drop);

    let dist = 8.5;
    if (loc1 && loc2 && loc1.name !== loc2.name) {
      dist = computeDistanceKm(loc1.lat, loc1.lng, loc2.lat, loc2.lng);
    } else if (loc1 && loc2 && loc1.name === loc2.name) {
      dist = 2.0;
    }
    setDistanceKm(dist);
    const duration = Math.max(5, Math.round(dist * 2.1));
    setDurationMinutes(duration);
  }, [pickup, drop]);

  // Fetch real-time multi-category fare estimates from backend
  const fetchEstimates = useCallback(async () => {
    if (distanceKm <= 0) return;
    try {
      setLoadingEstimates(true);
      setErrorMessage("");
      const res = await api.get("/api/rides/estimate", {
        params: {
          distanceKm,
          durationMinutes,
        },
      });
      if (Array.isArray(res.data)) {
        setFareEstimates(res.data);
      }
    } catch (err) {
      console.error("Failed to load fare estimates:", err);
    } finally {
      setLoadingEstimates(false);
    }
  }, [distanceKm, durationMinutes]);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  // Handle ride booking submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!pickup || !drop) {
      setErrorMessage("Please select both pickup and destination locations.");
      return;
    }

    if (pickup === drop) {
      setErrorMessage("Pickup and destination cannot be identical.");
      return;
    }

    if (activeRideConflict) {
      setErrorMessage(
        `You already have an active ride (#${activeRideConflict.id} in ${activeRideConflict.status} status). Please complete or cancel it before booking a new one.`
      );
      return;
    }

    const loc1 = POPULAR_LOCATIONS.find((l) => l.name === pickup) || {
      lat: 11.0168,
      lng: 76.9558,
    };
    const loc2 = POPULAR_LOCATIONS.find((l) => l.name === drop) || {
      lat: 11.0300,
      lng: 77.0434,
    };

    const requestPayload = {
      pickupLocation: pickup,
      dropLocation: drop,
      distanceKm: distanceKm,
      estimatedDurationMinutes: durationMinutes,
      vehicleCategory: selectedCategory,
      pickupLatitude: loc1.lat,
      pickupLongitude: loc1.lng,
      dropLatitude: loc2.lat,
      dropLongitude: loc2.lng,
    };

    try {
      setSubmitting(true);
      const res = await api.post("/api/rides/book", requestPayload);
      const createdRide = res.data;

      setBookingSuccess(createdRide);

      // Auto-redirect to dashboard after 2 seconds so the rider sees the active journey card
      setTimeout(() => {
        navigate("/rider/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Failed to book ride:", err);
      const message =
        err.response?.data?.message ||
        (err.response?.status === 409
          ? "You already have an active ride in progress. Return to Dashboard to track it."
          : "Unable to complete booking. Please try again.");
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "BIKE":
        return <Bike size={24} />;
      case "AUTO":
        return <Navigation size={24} />;
      case "SUV":
        return <ShieldCheck size={24} />;
      default:
        return <CarFront size={24} />;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Top Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link
            to="/rider/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#475569",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "0.9rem",
              padding: "6px 12px",
              borderRadius: "8px",
              backgroundColor: "#f1f5f9",
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
              }}
            >
              <CarFront size={18} />
            </span>
            <strong style={{ fontSize: "1.1rem", color: "#0f172a" }}>RideFlow Booking</strong>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <LiveConnectionBadge />

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
              }}
            >
              {riderName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "#1e293b" }}>{riderName}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "1080px", margin: "32px auto", padding: "0 20px" }}>
        {/* Success Modal / Banner */}
        {bookingSuccess && (
          <div
            style={{
              padding: "24px",
              borderRadius: "16px",
              backgroundColor: "#ecfdf5",
              border: "1px solid #10b981",
              color: "#065f46",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.15)",
            }}
          >
            <CheckCircle2 size={36} color="#059669" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "1.15rem" }}>
                Ride Booked Successfully! (Ride #{bookingSuccess.id})
              </h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#047857" }}>
                Status: <strong>REQUESTED</strong> • Searching for the nearest available {selectedCategory} drivers.
                Redirecting to live tracking...
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/rider/dashboard")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: "#059669",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View Live Journey
            </button>
          </div>
        )}

        {/* Active Ride Conflict Warning */}
        {activeRideConflict && (
          <div
            style={{
              padding: "20px",
              borderRadius: "14px",
              backgroundColor: "#fffbeb",
              border: "1px solid #f59e0b",
              color: "#92400e",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <AlertCircle size={24} color="#d97706" />
              <div>
                <strong style={{ fontSize: "0.95rem" }}>Active Ride Already in Progress:</strong>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem" }}>
                  You already have Ride #{activeRideConflict.id} in{" "}
                  <strong>{activeRideConflict.status}</strong> status. Please finish or cancel this trip before requesting another.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/rider/dashboard")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: "#d97706",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Track Active Ride
            </button>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div
            style={{
              padding: "16px 20px",
              borderRadius: "12px",
              backgroundColor: "#fef2f2",
              border: "1px solid #f87171",
              color: "#991b1b",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Booking Form Layout Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "28px",
          }}
        >
          {/* Left Column: Route selection form */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "18px",
              padding: "28px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            }}
          >
            <h2 style={{ margin: "0 0 8px 0", fontSize: "1.3rem", color: "#0f172a" }}>
              Plan Your Trip
            </h2>
            <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: "0.9rem" }}>
              Select your pickup point and destination in Coimbatore.
            </p>

            <form onSubmit={handleBookingSubmit}>
              {/* Pickup location */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: "#10b981",
                    }}
                  />
                  PICKUP LOCATION
                </label>
                <select
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                    backgroundColor: "#f8fafc",
                    color: "#0f172a",
                    fontWeight: 500,
                  }}
                >
                  {POPULAR_LOCATIONS.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination location */}
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  <MapPin size={13} color="#f43f5e" />
                  DESTINATION LOCATION
                </label>
                <select
                  value={drop}
                  onChange={(e) => setDrop(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                    backgroundColor: "#f8fafc",
                    color: "#0f172a",
                    fontWeight: 500,
                  }}
                >
                  {POPULAR_LOCATIONS.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Route Summary Metric */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderRadius: "12px",
                  backgroundColor: "#f1f5f9",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase" }}>
                    ESTIMATED DISTANCE
                  </span>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                    {distanceKm} km
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase" }}>
                    ESTIMATED TIME
                  </span>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                    ~{durationMinutes} mins
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || Boolean(activeRideConflict)}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  borderRadius: "12px",
                  backgroundColor: Boolean(activeRideConflict) ? "#94a3b8" : "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "1rem",
                  cursor: Boolean(activeRideConflict) ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="rf-spin" /> Confirming Ride Request...
                  </>
                ) : (
                  <>
                    Confirm & Request {selectedCategory} <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Vehicle category selection with live fares */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "18px",
              padding: "28px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "1.3rem", color: "#0f172a" }}>
                Select Vehicle
              </h2>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Live Calculated Fares</span>
            </div>

            {loadingEstimates ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                <Loader2 size={28} className="rf-spin" style={{ margin: "0 auto 8px" }} />
                <p style={{ margin: 0 }}>Calculating category rates...</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                {fareEstimates.map((estimate) => {
                  const isSelected = selectedCategory === estimate.category;
                  return (
                    <div
                      key={estimate.category}
                      onClick={() => setSelectedCategory(estimate.category)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        borderRadius: "14px",
                        border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                        backgroundColor: isSelected ? "rgba(37, 99, 235, 0.04)" : "#ffffff",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            backgroundColor: isSelected ? "#2563eb" : "#f1f5f9",
                            color: isSelected ? "#ffffff" : "#475569",
                          }}
                        >
                          {getCategoryIcon(estimate.category)}
                        </span>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>
                              {estimate.categoryName}
                            </strong>
                            {estimate.category === "SEDAN" && (
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  backgroundColor: "#dbeafe",
                                  color: "#1e40af",
                                  fontWeight: 600,
                                }}
                              >
                                POPULAR
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                            Base ₹{estimate.baseFare} • ₹{estimate.perKmRate}/km
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
                          ₹{estimate.totalFare}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 500 }}>
                          Fastest match
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Safety Guarantee */}
            <div
              style={{
                marginTop: "24px",
                padding: "14px",
                borderRadius: "10px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "0.82rem",
                color: "#64748b",
              }}
            >
              <ShieldCheck size={20} color="#059669" />
              <span>All rides include GPS safety tracking and verified driver credentials.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
