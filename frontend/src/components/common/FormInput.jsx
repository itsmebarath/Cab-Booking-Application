import React from "react";

/**
 * FormInput component with clean label, left icon support, error feedback,
 * and high-contrast accessible states.
 */
export default function FormInput({
  id,
  name,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error = "",
  helperText = "",
  icon: Icon = null,
  required = false,
  disabled = false,
  autoComplete,
  className = "",
  ...props
}) {
  const inputId = id || name;

  return (
    <div className={`rf-form-field ${error ? "rf-field-has-error" : ""} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="rf-field-label">
          {label}
          {required && <span className="rf-field-required">*</span>}
        </label>
      )}

      <div className={`rf-input-wrapper ${Icon ? "rf-has-left-icon" : ""}`}>
        {Icon && (
          <span className="rf-input-left-icon" aria-hidden="true">
            <Icon size={18} />
          </span>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
          className="rf-text-input"
          {...props}
        />
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
