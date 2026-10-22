import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/api/auth/register", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });

      setSuccess(
        response.data?.message ||
          "Registration successful! You can now log in."
      );

      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      const message = err.response?.data?.message;

      setError(
        typeof message === "string"
          ? message
          : typeof err.response?.data === "string"
            ? err.response.data
            : "Registration failed. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <div className="logo">🚕</div>
          <h1>Create Account</h1>
          <p>Join us and book your next ride.</p>
        </div>

        {error && <div className="message error">{error}</div>}

        {success && (
          <div className="message success">{success}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
              autoComplete="tel"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="login-link">
          Already have an account?{" "}
          <Link to="/login">Sign In</Link>
        </p>

        <Link to="/" className="back-home">
          Back to Home
        </Link>
      </div>

      <style>{`
        .register-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 20px;
          background: #f5f7fb;
          font-family: Arial, sans-serif;
          box-sizing: border-box;
        }

        .register-card {
          width: 100%;
          max-width: 440px;
          padding: 32px;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          box-sizing: border-box;
        }

        .register-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .logo {
          font-size: 38px;
          margin-bottom: 10px;
        }

        .register-header h1 {
          margin: 0 0 8px;
          color: #172033;
          font-size: 28px;
        }

        .register-header p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 17px;
        }

        .form-group label {
          display: block;
          margin-bottom: 7px;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
        }

        .form-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          box-sizing: border-box;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .register-card button {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 8px;
          background: #2563eb;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .register-card button:hover {
          background: #1d4ed8;
        }

        .register-card button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .message {
          padding: 12px;
          margin-bottom: 18px;
          border-radius: 8px;
          font-size: 14px;
          overflow-wrap: anywhere;
        }

        .error {
          background: #fef2f2;
          color: #b91c1c;
        }

        .success {
          background: #f0fdf4;
          color: #15803d;
        }

        .login-link {
          margin-top: 22px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }

        .login-link a,
        .back-home {
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
        }

        .back-home {
          display: block;
          margin-top: 16px;
          text-align: center;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

export default Register;