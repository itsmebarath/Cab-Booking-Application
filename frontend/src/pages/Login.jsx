import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowRight, UserCheck } from "lucide-react";
import api from "../services/api";
import {
  AuthLayout,
  FormInput,
  PasswordInput,
  PrimaryButton,
  ErrorMessage,
} from "../components/common";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    // 1. Clear stale authentication and driver data before new login
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    localStorage.removeItem("driverId");
    localStorage.removeItem("userId");

    try {
      // 2. Send login request to POST /api/auth/login
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      // 3. Read actual backend response
      const data = response.data;
      const token = data.token || data.accessToken;
      const role = String(data.role || "").toUpperCase();

      if (!token) {
        throw new Error("Authentication token was not returned by the server.");
      }

      // 4. Save core credentials in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("name", data.name || "User");
      localStorage.setItem("email", data.email || email);

      if (data.userId) {
        localStorage.setItem("userId", String(data.userId));
      }

      // 5. Handle role-specific routing and ID resolution
      if (role === "DRIVER") {
        const isValidId = (val) => {
          if (val === null || val === undefined) return false;
          const s = String(val).trim();
          if (!s || s === "null" || s === "undefined" || s === "NaN") return false;
          const n = Number(s);
          return Number.isInteger(n) && n > 0;
        };

        let resolvedDriverId = isValidId(data.driverId)
          ? String(data.driverId)
          : null;

        // If driverId is missing or invalid in login response, fetch from GET /api/drivers/my-profile
        if (!resolvedDriverId) {
          try {
            const profileRes = await api.get("/api/drivers/my-profile", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (isValidId(profileRes.data?.driverId)) {
              resolvedDriverId = String(profileRes.data.driverId);
              if (profileRes.data.userId) {
                localStorage.setItem("userId", String(profileRes.data.userId));
              }
            }
          } catch (profileErr) {
            console.error("Failed to fetch driver profile during login:", profileErr);
          }
        }

        // Validate resolved driverId
        if (!resolvedDriverId) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("driverId");
          throw new Error(
            "Driver profile not found for this account. Please complete driver registration."
          );
        }

        // Save verified driverId in localStorage
        localStorage.setItem("driverId", resolvedDriverId);

        // Navigate to existing driver dashboard route
        navigate("/driver/dashboard", { replace: true });
      } else if (role === "RIDER") {
        // Route RIDER accounts to existing rider dashboard
        navigate("/rider/dashboard", { replace: true });
      } else if (role === "ADMIN") {
        // Route ADMIN accounts to admin dashboard
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Login failure:", err);
      setError(
        err.response?.data?.message ||
          (typeof err.response?.data === "string" ? err.response.data : null) ||
          err.message ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      accountType="RIDER"
      badgeText="ACCOUNT SIGN IN"
      title="Welcome Back!"
      subtitle="Sign in to your RideFlow account to continue."
      visualTitle={
        <>
          Every ride,
          <br />
          <span className="rf-text-yellow">made simple.</span>
        </>
      }
      visualSubtitle="Sign in to book rides, track your travel history, or access your driving workspace."
      footerPrompt="Don't have an account yet?"
      footerLink={{ text: "Create rider account", to: "/rider/register" }}
      alternateAccount={{
        prompt: "Are you a driver?",
        text: "Driver portal",
        to: "/driver/login",
      }}
    >
      <ErrorMessage message={error} onDismiss={() => setError("")} />

      <form onSubmit={handleSubmit} noValidate>
        <FormInput
          id="login-email"
          name="email"
          type="email"
          label="Email Address"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          icon={Mail}
          required
          autoComplete="email"
          disabled={loading}
        />

        <PasswordInput
          id="login-password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
          disabled={loading}
        />

        <PrimaryButton
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          iconRight={ArrowRight}
        >
          Sign In
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
}

export default Login;