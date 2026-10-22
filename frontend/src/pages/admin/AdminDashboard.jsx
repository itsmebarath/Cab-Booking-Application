import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CarFront,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Users,
  UserRound,
  Settings,
  ChartNoAxesCombined,
} from "lucide-react";

import api from "../../services/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const adminName = localStorage.getItem("name") || "Administrator";
  const adminEmail = localStorage.getItem("email") || "";

  useEffect(() => {
    if (
      localStorage.getItem("role") !== "ADMIN" ||
      !localStorage.getItem("token")
    ) {
      navigate("/admin/login", { replace: true });
      return;
    }

    loadStats();
  }, [navigate]);

  const loadStats = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/admin/stats");
      setStats(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load admin statistics. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("email");

    navigate("/admin/login", { replace: true });
  };

  /*
   * Format common backend statistic keys for display.
   * Unknown fields are still shown in the additional statistics section.
   */
  const formatLabel = (key) =>
    key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return "—";
    }

    if (typeof value === "number") {
      return value.toLocaleString();
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  };

  const getStatIcon = (key) => {
    const normalized = key.toLowerCase();

    if (normalized.includes("driver")) return Users;
    if (normalized.includes("rider") || normalized.includes("user")) {
      return UserRound;
    }
    if (normalized.includes("ride") || normalized.includes("trip")) {
      return CarFront;
    }
    if (
      normalized.includes("earning") ||
      normalized.includes("revenue") ||
      normalized.includes("payment")
    ) {
      return ChartNoAxesCombined;
    }

    return Activity;
  };

  const getStatColor = (key) => {
    const normalized = key.toLowerCase();

    if (normalized.includes("driver")) return "green";
    if (normalized.includes("rider") || normalized.includes("user")) {
      return "purple";
    }
    if (normalized.includes("ride") || normalized.includes("trip")) {
      return "blue";
    }

    return "orange";
  };

  const statEntries =
    stats && typeof stats === "object" && !Array.isArray(stats)
      ? Object.entries(stats).filter(
          ([, value]) =>
            value === null ||
            ["string", "number", "boolean"].includes(typeof value)
        )
      : [];

  const primaryStats = statEntries.slice(0, 4);
  const additionalStats = statEntries.slice(4);

  return (
    <main className="rf-admin-dashboard">
      {/* Sidebar */}
      <aside className="rf-admin-sidebar">
        <a href="/" className="rf-admin-dashboard-brand">
          <span className="rf-admin-dashboard-brand-icon">
            <CarFront size={25} />
          </span>

          <span>
            Ride<span>Flow</span>
          </span>
        </a>

        <div className="rf-admin-sidebar-label">ADMINISTRATION</div>

        <nav className="rf-admin-dashboard-nav">
          <button
            type="button"
            className="rf-admin-nav-item active"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <LayoutDashboard size={19} />
            <span>Overview</span>
          </button>

          <button
            type="button"
            className="rf-admin-nav-item"
            title="User management page not implemented here yet"
            onClick={() =>
              alert("The user management page has not been implemented yet.")
            }
          >
            <Users size={19} />
            <span>Users</span>
          </button>

          <button
            type="button"
            className="rf-admin-nav-item"
            title="Ride management page not implemented here yet"
            onClick={() =>
              alert("The ride management page has not been implemented yet.")
            }
          >
            <CarFront size={19} />
            <span>Rides</span>
          </button>

          <button
            type="button"
            className="rf-admin-nav-item"
            title="Settings page not implemented here yet"
            onClick={() =>
              alert("The settings page has not been implemented yet.")
            }
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="rf-admin-sidebar-bottom">
          <div className="rf-admin-sidebar-help">
            <span className="rf-admin-help-icon">
              <CircleHelp size={20} />
            </span>

            <h4>Need assistance?</h4>

            <p>Contact your platform support team for help.</p>
          </div>

          <button
            type="button"
            className="rf-admin-dashboard-logout"
            onClick={logout}
          >
            <LogOut size={19} />
            <span>Log out</span>
          </button>

          <div className="rf-admin-sidebar-footer">
            <ShieldCheck size={15} />
            Secure Admin Portal
          </div>
        </div>
      </aside>

      {/* Main area */}
      <section className="rf-admin-dashboard-main">
        <header className="rf-admin-dashboard-topbar">
          <div>
            <div className="rf-admin-dashboard-breadcrumb">
              Administration <span>/</span> Overview
            </div>

            <h2>Admin Dashboard</h2>
          </div>

          <div className="rf-admin-topbar-actions">
            <button
              type="button"
              className="rf-admin-dashboard-refresh"
              onClick={loadStats}
              disabled={loading}
              title="Refresh statistics"
              aria-label="Refresh statistics"
            >
              <RefreshCw
                size={18}
                className={loading ? "rf-admin-spinning" : ""}
              />
            </button>

            <div className="rf-admin-topbar-profile">
              <div className="rf-admin-dashboard-avatar">
                {adminName.charAt(0).toUpperCase()}
              </div>

              <div className="rf-admin-dashboard-profile-info">
                <strong>{adminName}</strong>
                <span>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <div className="rf-admin-dashboard-content">
          {/* Welcome banner */}
          <section className="rf-admin-dashboard-welcome">
            <div className="rf-admin-dashboard-welcome-content">
              <span className="rf-admin-dashboard-welcome-label">
                PLATFORM CONTROL CENTER
              </span>

              <h1>
                Welcome back, {adminName.split(" ")[0]}!
              </h1>

              <p>
                Here's your RideFlow platform overview. Monitor the
                statistics returned by your backend and manage your
                administrative tasks.
              </p>

              <div className="rf-admin-welcome-badge">
                <span />
                Administrator workspace
              </div>
            </div>

            <div className="rf-admin-dashboard-welcome-art">
              <div className="rf-admin-dashboard-art-circle">
                <ChartNoAxesCombined size={82} strokeWidth={1.35} />
              </div>
            </div>
          </section>

          {/* Statistics */}
          <section className="rf-admin-dashboard-section">
            <div className="rf-admin-dashboard-section-heading">
              <div>
                <h2>Platform statistics</h2>
                <p>Live values from your admin statistics API.</p>
              </div>

              <button
                type="button"
                className="rf-admin-text-button"
                onClick={loadStats}
                disabled={loading}
              >
                <RefreshCw size={15} />
                Refresh
              </button>
            </div>

            {error && (
              <div className="rf-admin-dashboard-error" role="alert">
                <Activity size={19} />

                <div>
                  <strong>Statistics unavailable</strong>
                  <p>{error}</p>

                  <button type="button" onClick={loadStats}>
                    Try again
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {loading && !stats ? (
              <div className="rf-admin-dashboard-loading">
                <RefreshCw size={22} className="rf-admin-spinning" />
                <span>Loading platform statistics...</span>
              </div>
            ) : stats && primaryStats.length > 0 ? (
              <div className="rf-admin-dashboard-stats">
                {primaryStats.map(([key, value]) => {
                  const Icon = getStatIcon(key);
                  const color = getStatColor(key);

                  return (
                    <article
                      className="rf-admin-stat-card"
                      key={key}
                    >
                      <div className="rf-admin-stat-card-top">
                        <span className={`rf-admin-stat-icon ${color}`}>
                          <Icon size={21} />
                        </span>

                        <span className="rf-admin-stat-live">
                          <span />
                          API data
                        </span>
                      </div>

                      <h3>{formatValue(value)}</h3>

                      <p>{formatLabel(key)}</p>

                      <div className="rf-admin-stat-card-footer">
                        <span>Backend statistic</span>
                        <ArrowUpRight size={15} />
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              !error && (
                <div className="rf-admin-dashboard-empty">
                  <Activity size={27} />

                  <h3>No statistics available</h3>

                  <p>
                    The statistics endpoint returned no displayable
                    values. Check its response in your backend.
                  </p>
                </div>
              )
            )}

            {additionalStats.length > 0 && (
              <div className="rf-admin-additional-stats">
                <h3>Additional statistics</h3>

                <div className="rf-admin-additional-grid">
                  {additionalStats.map(([key, value]) => (
                    <div
                      className="rf-admin-additional-item"
                      key={key}
                    >
                      <span>{formatLabel(key)}</span>
                      <strong>{formatValue(value)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Admin actions */}
          <section className="rf-admin-dashboard-section">
            <div className="rf-admin-dashboard-section-heading">
              <div>
                <h2>Quick access</h2>
                <p>Shortcuts for your administrative workflow.</p>
              </div>
            </div>

            <div className="rf-admin-quick-access">
              <article className="rf-admin-quick-card">
                <span className="rf-admin-quick-icon blue">
                  <Users size={22} />
                </span>

                <div>
                  <h3>User management</h3>
                  <p>Review rider and driver accounts.</p>
                </div>

                <ArrowRight size={18} />
              </article>

              <article className="rf-admin-quick-card">
                <span className="rf-admin-quick-icon green">
                  <CarFront size={22} />
                </span>

                <div>
                  <h3>Ride management</h3>
                  <p>Review platform ride information.</p>
                </div>

                <ArrowRight size={18} />
              </article>

              <article className="rf-admin-quick-card">
                <span className="rf-admin-quick-icon purple">
                  <Activity size={22} />
                </span>

                <div>
                  <h3>Platform activity</h3>
                  <p>Monitor available platform statistics.</p>
                </div>

                <ArrowRight size={18} />
              </article>
            </div>
          </section>

          {/* Account information */}
          <section className="rf-admin-dashboard-section">
            <div className="rf-admin-dashboard-section-heading">
              <div>
                <h2>Administrator account</h2>
                <p>Your currently signed-in account details.</p>
              </div>
            </div>

            <div className="rf-admin-account-card">
              <div className="rf-admin-account-avatar">
                {adminName.charAt(0).toUpperCase()}
              </div>

              <div className="rf-admin-account-details">
                <h3>{adminName}</h3>
                <p>{adminEmail || "Email not available"}</p>
              </div>

              <span className="rf-admin-account-role">
                <ShieldCheck size={15} />
                Admin
              </span>
            </div>
          </section>

          <footer className="rf-admin-dashboard-footer">
            <span>© {new Date().getFullYear()} RideFlow</span>

            <span>
              <ShieldCheck size={14} />
              Administrative workspace
            </span>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default AdminDashboard;