import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  ShieldCheck,
  Clock3,
  MapPin,
  Eye,
  EyeOff,
} from "lucide-react";

import api from "../../services/api";

function RiderLogin() {
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

      if (data.role !== "RIDER") {
        setError("This account is not registered as a Rider.");
        return;
      }

      localStorage.removeItem("driverId");
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("name", data.name);
      localStorage.setItem("email", data.email);

      navigate("/rider/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="rf-login-page">
      {/* Left promotional panel */}
      <section className="rf-login-visual">
        <Link to="/" className="rf-login-brand">
          <span className="rf-brand-icon">
            <CarFront size={27} />
          </span>

          <span>
            Ride<span>Flow</span>
          </span>
        </Link>

        <div className="rf-visual-content">
          <span className="rf-eyebrow">
            YOUR JOURNEY STARTS HERE
          </span>

          <h1>
            Every ride,
            <br />
            <span>made simple.</span>
          </h1>

          <p className="rf-visual-description">
            Get where you need to go with a convenient cab booking
            experience designed around you.
          </p>

          <div className="rf-feature-list">
            <div className="rf-feature">
              <span className="rf-feature-icon">
                <MapPin size={20} />
              </span>

              <div>
                <h3>Easy booking</h3>
                <p>Choose your pickup and destination.</p>
              </div>
            </div>

            <div className="rf-feature">
              <span className="rf-feature-icon">
                <Clock3 size={20} />
              </span>

              <div>
                <h3>Save your time</h3>
                <p>Plan your trips with less hassle.</p>
              </div>
            </div>

            <div className="rf-feature">
              <span className="rf-feature-icon">
                <ShieldCheck size={20} />
              </span>

              <div>
                <h3>Account protection</h3>
                <p>Sign in to access your rider account.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="rf-visual-footer">
          Your destination. Your journey. Your RideFlow.
        </p>
      </section>

      {/* Right login panel */}
      <section className="rf-login-content">
        <Link to="/" className="rf-back-home">
          <ArrowLeft size={17} />
          Back to home
        </Link>

        <div className="rf-login-card">
          <div className="rf-mobile-brand">
            <span className="rf-brand-icon">
              <CarFront size={25} />
            </span>

            <span>
              Ride<span>Flow</span>
            </span>
          </div>

          <div className="rf-login-heading">
            <span className="rf-login-label">RIDER ACCOUNT</span>

            <h2>Welcome back!</h2>

            <p>
              Sign in to your account and get ready for your next ride.
            </p>
          </div>

          {error && (
            <div className="rf-login-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="rf-form-group">
              <label htmlFor="rider-email">Email address</label>

              <input
                id="rider-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="rf-form-group">
              <div className="rf-password-label">
                <label htmlFor="rider-password">Password</label>
              </div>

              <div className="rf-password-input">
                <input
                  id="rider-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="rf-password-toggle"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="rf-login-button"
              disabled={loading}
            >
              {loading ? (
                "Signing you in..."
              ) : (
                <>
                  Sign in to RideFlow
                  <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>

          <div className="rf-login-divider">
            <span>NEW TO RIDEFLOW?</span>
          </div>

          <Link to="/rider/register" className="rf-create-account">
            Create your rider account
          </Link>

          <p className="rf-login-terms">
            By signing in, you can access your rider account and booking
            features.
          </p>
        </div>

        <p className="rf-login-bottom">
          Need a different account?{" "}
          <Link to="/driver/login">Driver login</Link>
          {" · "}
          <Link to="/admin/login">Admin login</Link>
        </p>
      </section>
    </main>
  );
}

export default RiderLogin;