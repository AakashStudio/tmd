"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  id,
  className = "",
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-[#9e9ea8] uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3.5 py-2.5 rounded-lg bg-[#14141a] border ${
          error ? "border-[#ef4444]" : "border-[#24242e] focus:border-[#ff1475]"
        } text-white placeholder-[#5e5e6e] text-sm transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-[#ff1475] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-[#ef4444] font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-[#5e5e6e]">{helperText}</p>}
    </div>
  );
};
