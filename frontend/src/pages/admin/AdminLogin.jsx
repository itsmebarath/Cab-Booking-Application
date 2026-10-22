import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  ShieldCheck,
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  Activity,
  Users,
  ChartNoAxesCombined,
} from "lucide-react";

import api from "../../services/api";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      const data = response.data;

      if (data.role !== "ADMIN") {
        setError("Access denied. This account is not an Admin.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("name", data.name);
      localStorage.setItem("email", data.email);

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="rf-admin-login-page">
      {/* Left promotional panel */}
      <section className="rf-admin-login-visual">
        <Link to="/" className="rf-admin-brand">
          <span className="rf-admin-brand-icon">
            <CarFront size={27} />
          </span>

          <span>
            Ride<span>Flow</span>
          </span>
        </Link>

        <div className="rf-admin-visual-content">
          <span className="rf-admin-eyebrow">
            ADMINISTRATION PORTAL
          </span>

          <h1>
            Manage every
            <br />
            <span>journey with confidence.</span>
          </h1>

          <p>
            Access your administrative workspace to manage platform
            users, monitor ride activity, and oversee your RideFlow
            operations.
          </p>

          <div className="rf-admin-feature-list">
            <div className="rf-admin-feature">
              <span>
                <Users size={19} />
              </span>

              <div>
                <h3>User management</h3>
                <p>Manage rider and driver accounts.</p>
              </div>
            </div>

            <div className="rf-admin-feature">
              <span>
                <Activity size={19} />
              </span>

              <div>
                <h3>Platform monitoring</h3>
                <p>Review platform activity.</p>
              </div>
            </div>

            <div className="rf-admin-feature">
              <span>
                <ChartNoAxesCombined size={19} />
              </span>

              <div>
                <h3>Operational insights</h3>
                <p>Access available dashboard statistics.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rf-admin-visual-footer">
          <ShieldCheck size={16} />
          Restricted access for authorized administrators
        </div>
      </section>

      {/* Right login panel */}
      <section className="rf-admin-login-content">
        <Link to="/" className="rf-admin-back-home">
          <ArrowLeft size={17} />
          Back to home
        </Link>

        <div className="rf-admin-login-card">
          <Link to="/" className="rf-admin-mobile-brand">
            <span className="rf-admin-brand-icon">
              <CarFront size={25} />
            </span>

            <span>
              Ride<span>Flow</span>
            </span>
          </Link>

          <div className="rf-admin-login-icon">
            <LockKeyhole size={25} />
          </div>

          <div className="rf-admin-login-heading">
            <span>SECURE ADMIN ACCESS</span>

            <h2>Welcome back</h2>

            <p>
              Sign in with your administrator credentials to continue.
            </p>
          </div>

          {error && (
            <div className="rf-admin-login-error" role="alert">
              <ShieldCheck size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="rf-admin-form-group">
              <label htmlFor="admin-email">Email address</label>

              <div className="rf-admin-input-wrapper">
                <Mail size={18} />

                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="rf-admin-form-group">
              <label htmlFor="admin-password">Password</label>

              <div className="rf-admin-input-wrapper">
                <LockKeyhole size={18} />

                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="rf-admin-password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="rf-admin-security-note">
              <ShieldCheck size={16} />
              <span>Secure administrator authentication</span>
            </div>

            <button
              type="submit"
              className="rf-admin-login-button"
              disabled={loading}
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign in to Admin Portal
                  <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>

          <div className="rf-admin-login-divider">
            <span>AUTHORIZED PERSONNEL ONLY</span>
          </div>

          <p className="rf-admin-access-notice">
            This portal is intended for authorized RideFlow
            administrators. Rider and driver accounts cannot access
            this workspace.
          </p>
        </div>

        <p className="rf-admin-login-bottom">
          <ShieldCheck size={15} />
          Protected administrative access
        </p>
      </section>
    </main>
  );
}

export default AdminLogin;