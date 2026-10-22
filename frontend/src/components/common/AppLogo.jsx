import React from "react";
import { Link } from "react-router-dom";
import { CarFront } from "lucide-react";

/**
 * RideFlow Brand Logo component.
 * Features a modern yellow emblem with stylized dark navy vehicle icon.
 */
export default function AppLogo({
  size = "md",
  light = false,
  to = "/",
  subtitle = null,
  showLink = true,
  className = "",
}) {
  const sizeStyles = {
    sm: { iconBox: 32, iconSize: 18, fontSize: "1.15rem", dotSize: 6 },
    md: { iconBox: 40, iconSize: 22, fontSize: "1.4rem", dotSize: 7 },
    lg: { iconBox: 48, iconSize: 26, fontSize: "1.75rem", dotSize: 8 },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  const content = (
    <div className={`rf-logo-root ${light ? "rf-logo-light" : ""} ${className}`}>
      <span
        className="rf-logo-icon-badge"
        style={{
          width: currentSize.iconBox,
          height: currentSize.iconBox,
          minWidth: currentSize.iconBox,
        }}
      >
        <CarFront size={currentSize.iconSize} strokeWidth={2.4} />
      </span>

      <div className="rf-logo-text-group">
        <span
          className="rf-logo-text"
          style={{ fontSize: currentSize.fontSize }}
        >
          <span className="rf-logo-ride">Ride</span>
          <span className="rf-logo-flow">Flow</span>
          <span
            className="rf-logo-dot"
            style={{
              width: currentSize.dotSize,
              height: currentSize.dotSize,
            }}
          />
        </span>
        {subtitle && <span className="rf-logo-subtitle">{subtitle}</span>}
      </div>
    </div>
  );

  if (!showLink) {
    return content;
  }

  return (
    <Link to={to} className="rf-logo-link" aria-label="RideFlow Home">
      {content}
    </Link>
  );
}
