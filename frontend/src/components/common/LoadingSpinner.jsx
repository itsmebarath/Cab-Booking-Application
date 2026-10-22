import React from "react";

/**
 * LoadingSpinner component for button states and async data fetching.
 * Supports "sm", "md", "lg" sizes and different color variants.
 */
export default function LoadingSpinner({
  size = "sm",
  color = "currentColor",
  className = "",
  ariaLabel = "Loading...",
}) {
  const sizeMap = {
    xs: 14,
    sm: 18,
    md: 24,
    lg: 32,
    xl: 44,
  };

  const pixelSize = typeof size === "number" ? size : sizeMap[size] || 18;

  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={`rf-spinner-container ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
      }}
    >
      <svg
        className="rf-spinner-svg"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: "100%",
          height: "100%",
          animation: "rf-spin 0.8s linear infinite",
        }}
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="3"
        />
        <path
          d="M12 3a9 9 0 0 1 9 9"
          stroke={color === "currentColor" ? "currentColor" : color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
