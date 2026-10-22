import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import api from "../../services/api";
import {
  AuthLayout,
  FormInput,
  PasswordInput,
  PrimaryButton,
  ErrorMessage,
} from "../../components/common";

function DriverLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
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
      // 2. Post login credentials
      const response = await api.post("/api/auth/login", {
        email: email.trim(),
        password,
      });

      const data = response.data;
      const token = data.token || data.accessToken;
      const role = String(data.role || "").toUpperCase();

      if (!token) {
        throw new Error("Authentication token was not returned by the server.");
      }

      // 3. Verify driver role
      if (role !== "DRIVER") {
        throw new Error(
          "Access denied: This account is not registered as a Driver. Please use Rider or Admin login."
        );
      }

      // 4. Save core credentials in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("role", "DRIVER");
      localStorage.setItem("name", data.name || "Driver");
      localStorage.setItem("email", data.email || email.trim());

      if (data.userId) {
        localStorage.setItem("userId", String(data.userId));
      }

      // 5. Determine and verify driverId
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

      // If driverId was not in login response, fetch profile using newly issued JWT
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

      // 6. Validate resolved driverId
      if (!resolvedDriverId) {
        // Clear token so user is not stuck in an unconfigured driver state
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("driverId");
        throw new Error(
          "Driver profile not found for this account. Please complete driver registration."
        );
      }

      // 7. Save verified driverId in localStorage
      localStorage.setItem("driverId", resolvedDriverId);

      // 8. Navigate to driver dashboard
      navigate("/driver/dashboard", { replace: true });
    } catch (err) {
      console.error("Driver login failure:", err);
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
      accountType="DRIVER"
      badgeText="DRIVER ACCOUNT"
      title="Welcome Back!"
      subtitle="Sign in to your account and get ready to manage your rides."
      visualTitle={
        <>
          Drive your way,
          <br />
          <span className="rf-text-yellow">grow your earnings.</span>
        </>
      }
      visualSubtitle="Join RideFlow's trusted driver fleet with instant ride requests, automated fare payouts, and dedicated driver support."
      footerPrompt="New to RideFlow?"
      footerLink={{ text: "Create your driver account", to: "/driver/register" }}
      alternateAccount={{
        prompt: "Need a different account?",
        text: "Rider login",
        to: "/rider/login",
      }}
    >
      <ErrorMessage message={error} onDismiss={() => setError("")} />

      <form onSubmit={handleSubmit} noValidate>
        <FormInput
          id="driver-email"
          name="email"
          type="email"
          label="Email Address"
          placeholder="driver@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={Mail}
          required
          autoComplete="email"
          disabled={loading}
        />

        <PasswordInput
          id="driver-password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          Sign In as Driver
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
}

export default DriverLogin;