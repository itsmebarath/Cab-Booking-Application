import React from "react";
import { Inbox } from "lucide-react";

/**
 * EmptyState component for displays where no items/rides/requests exist.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = "No data found",
  description = "There are no records to display at this time.",
  action = null,
  className = "",
}) {
  return (
    <div className={`rf-empty-state ${className}`}>
      <div className="rf-empty-state-icon">
        <Icon size={32} strokeWidth={1.75} />
      </div>
      <h3 className="rf-empty-state-title">{title}</h3>
      <p className="rf-empty-state-description">{description}</p>
      {action && <div className="rf-empty-state-action">{action}</div>}
    </div>
  );
}
