import React from "react";
import { CarFront, Users, Clock, Sparkles } from "lucide-react";

/**
 * RideOptionCard for selecting ride category in Rider Dashboard booking flow.
 */
export default function RideOptionCard({
  id,
  name,
  description = "",
  fareEstimate,
  duration = "3-5 mins",
  capacity = "4 seats",
  icon: Icon = CarFront,
  isSelected = false,
  onSelect,
  tag = null,
  className = "",
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect && onSelect(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect && onSelect(id);
        }
      }}
      className={`rf-ride-option-card ${isSelected ? "rf-option-selected" : ""} ${className}`}
      aria-pressed={isSelected}
      aria-label={`Select ${name} category`}
    >
      {tag && (
        <span className="rf-option-tag">
          <Sparkles size={12} /> {tag}
        </span>
      )}

      <div className="rf-option-icon-box">
        <Icon size={28} strokeWidth={2} />
      </div>

      <div className="rf-option-info">
        <div className="rf-option-title-row">
          <h4 className="rf-option-name">{name}</h4>
          <span className="rf-option-fare">{fareEstimate}</span>
        </div>

        {description && <p className="rf-option-desc">{description}</p>}

        <div className="rf-option-meta">
          <span className="rf-meta-item">
            <Clock size={13} /> {duration}
          </span>
          <span className="rf-meta-divider">•</span>
          <span className="rf-meta-item">
            <Users size={13} /> {capacity}
          </span>
        </div>
      </div>

      <div className="rf-option-indicator" aria-hidden="true">
        <span className="rf-indicator-radio" />
      </div>
    </div>
  );
}
