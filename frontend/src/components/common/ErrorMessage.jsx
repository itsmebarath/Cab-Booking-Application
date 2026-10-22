import React from "react";
import { AlertCircle, X } from "lucide-react";

/**
 * ErrorMessage banner component.
 */
export default function ErrorMessage({
  message,
  onDismiss = null,
  className = "",
}) {
  if (!message) return null;

  return (
    <div className={`rf-alert rf-alert-danger ${className}`} role="alert">
      <span className="rf-alert-icon" aria-hidden="true">
        <AlertCircle size={18} />
      </span>
      <div className="rf-alert-content">
        <span className="rf-alert-text">{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rf-alert-dismiss"
          aria-label="Dismiss error"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
