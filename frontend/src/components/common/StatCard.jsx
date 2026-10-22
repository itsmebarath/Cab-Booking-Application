import React from "react";

/**
 * StatCard component for displaying key statistics across Rider and Driver dashboards.
 */
export default function StatCard({
  icon: Icon,
  title,
  value,
  subtext = "",
  color = "yellow", // "yellow" | "navy" | "green" | "blue" | "red"
  badge = null,
  className = "",
}) {
  return (
    <article className={`rf-stat-card rf-stat-color-${color} ${className}`}>
      <div className="rf-stat-header">
        <span className="rf-stat-icon-wrapper" aria-hidden="true">
          {Icon && <Icon size={20} strokeWidth={2.2} />}
        </span>
        {badge && <span className="rf-stat-badge">{badge}</span>}
      </div>

      <div className="rf-stat-body">
        <span className="rf-stat-title">{title}</span>
        <h3 className="rf-stat-value">{value}</h3>
        {subtext && <p className="rf-stat-subtext">{subtext}</p>}
      </div>
    </article>
  );
}
