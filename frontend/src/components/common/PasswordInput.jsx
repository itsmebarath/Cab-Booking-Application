import React, { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

/**
 * PasswordInput component with built-in show/hide toggle.
 */
export default function PasswordInput({
  id = "password",
  name = "password",
  label = "Password",
  placeholder = "••••••••",
  value,
  onChange,
  error = "",
  helperText = "",
  icon: LeftIcon = Lock,
  required = false,
  disabled = false,
  autoComplete = "current-password",
  minLength,
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name;

  return (
    <div className={`rf-form-field ${error ? "rf-field-has-error" : ""} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="rf-field-label">
          {label}
          {required && <span className="rf-field-required">*</span>}
        </label>
      )}

      <div className={`rf-input-wrapper ${LeftIcon ? "rf-has-left-icon" : ""} rf-has-right-btn`}>
        {LeftIcon && (
          <span className="rf-input-left-icon" aria-hidden="true">
            <LeftIcon size={18} />
          </span>
        )}

        <input
          id={inputId}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          minLength={minLength}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
          className="rf-text-input rf-password-field"
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="rf-password-visibility-btn"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={0}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="rf-field-error-text" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-help`} className="rf-field-helper-text">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
