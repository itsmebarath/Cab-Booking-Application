import React from "react";
import LoadingSpinner from "./LoadingSpinner";

/**
 * PrimaryButton component conforming to RideFlow design system.
 * Defaults to primary yellow (#FFC928) with dark navy text (#101827).
 */
export default function PrimaryButton({
  children,
  onClick,
  type = "button",
  loading = false,
  disabled = false,
  variant = "primary", // "primary" | "secondary" | "outline" | "danger" | "ghost"
  size = "md", // "sm" | "md" | "lg"
  fullWidth = false,
  icon: Icon = null,
  iconRight: IconRight = null,
  className = "",
  ariaLabel,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={ariaLabel}
      className={`rf-btn rf-btn-${variant} rf-btn-${size} ${
        fullWidth ? "rf-btn-full" : ""
      } ${loading ? "rf-btn-loading" : ""} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size={size === "lg" ? "md" : "sm"} />
          <span className="rf-btn-text-loading">Processing...</span>
        </>
      ) : (
        <>
          {Icon && (
            <span className="rf-btn-icon-left">
              <Icon size={size === "lg" ? 20 : size === "sm" ? 15 : 18} />
            </span>
          )}
          <span className="rf-btn-label">{children}</span>
          {IconRight && (
            <span className="rf-btn-icon-right">
              <IconRight size={size === "lg" ? 20 : size === "sm" ? 15 : 18} />
            </span>
          )}
        </>
      )}
    </button>
  );
}
