import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  ShieldCheck,
  MapPin,
  Eye,
  EyeOff,
  UserRound,
  Mail,
  Phone,
} from "lucide-react";

import api from "../../services/api";

function RiderRegister() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/api/users/register", {
        ...form,
        role: "RIDER",
      });

      navigate("/rider/login", {
        state: {
          message: "Registration successful. Please log in.",
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="rf-register-page">
      {/* Left promotional panel */}
      <section className="rf-register-visual">
        <Link to="/" className="rf-login-brand">
          <span className="rf-brand-icon">
            <CarFront size={27} />
          </span>

          <span>
            Ride<span>Flow</span>
          </span>
        </Link>

        <div className="rf-register-visual-content">
          <span className="rf-eyebrow">
            YOUR NEXT JOURNEY BEGINS
          </span>

          <h1>
            Your city,
            <br />
            <span>your journey.</span>
          </h1>

          <p className="rf-register-visual-description">
            Create your RideFlow account and get ready to make your
            everyday journeys simpler.
          </p>

          <div className="rf-register-benefits">
            <div>
              <span className="rf-register-benefit-icon">
                <MapPin size={20} />
              </span>

              <div>
                <h3>Convenient travel</h3>
                <p>Plan rides to your favourite destinations.</p>
              </div>
            </div>

            <div>
              <span className="rf-register-benefit-icon">
                <ShieldCheck size={20} />
              </span>

              <div>
                <h3>Your own account</h3>
                <p>Access your rider account when you need it.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="rf-register-visual-footer">
          RideFlow — move through your day with ease.
        </p>
      </section>

      {/* Right registration panel */}
      <section className="rf-register-content">
        <Link to="/" className="rf-back-home">
          <ArrowLeft size={17} />
          Back to home
        </Link>

        <div className="rf-register-card">
          <Link to="/" className="rf-mobile-brand">
            <span className="rf-brand-icon">
              <CarFront size={25} />
            </span>

            <span>
              Ride<span>Flow</span>
            </span>
          </Link>

          <div className="rf-register-heading">
            <span className="rf-login-label">CREATE YOUR ACCOUNT</span>

            <h2>Join RideFlow</h2>

            <p>
              Enter your details to create your rider account.
            </p>
          </div>

          {error && (
            <div className="rf-login-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="rf-register-form-group">
              <label htmlFor="register-name">Full name</label>

              <div className="rf-register-input">
                <UserRound size={18} />

                <input
                  id="register-name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="rf-register-form-group">
              <label htmlFor="register-email">Email address</label>

              <div className="rf-register-input">
                <Mail size={18} />

                <input
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="rf-register-form-group">
              <label htmlFor="register-phone">Phone number</label>

              <div className="rf-register-input">
                <Phone size={18} />

                <input
                  id="register-phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div className="rf-register-form-group">
              <label htmlFor="register-password">Password</label>

              <div className="rf-register-input">
                <ShieldCheck size={18} />

                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="rf-register-password-toggle"
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

              <span className="rf-register-hint">
                Use at least 8 characters.
              </span>
            </div>

            <button
              type="submit"
              className="rf-register-button"
              disabled={loading}
            >
              {loading ? (
                "Creating your account..."
              ) : (
                <>
                  Create rider account
                  <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>

          <div className="rf-register-divider">
            <span>ALREADY HAVE AN ACCOUNT?</span>
          </div>

          <Link to="/rider/login" className="rf-register-login-link">
            Sign in to RideFlow
          </Link>
        </div>

        <p className="rf-register-bottom">
          Looking for another account?{" "}
          <Link to="/driver/register">Register as a driver</Link>
          {" · "}
          <Link to="/admin/login">Admin login</Link>
        </p>
      </section>
    </main>
  );
}

export default RiderRegister;