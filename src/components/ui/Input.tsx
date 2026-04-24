"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "_");
    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`input ${error ? "input-error" : ""} ${className}`}
          {...props}
        />
        {hint && !error && (
          <p className="field-error" style={{ color: "var(--color-muted)" }}>
            {hint}
          </p>
        )}
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

// ---------------------------------------------------------------------------
// Select variant
// ---------------------------------------------------------------------------

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, placeholder, options, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "_");
    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          className={`input ${error ? "input-error" : ""} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

// ---------------------------------------------------------------------------
// Textarea variant
// ---------------------------------------------------------------------------

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "_");
    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={`input ${error ? "input-error" : ""} ${className}`}
          rows={4}
          {...props}
        />
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
