import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className = "",
  ...props
}: InputProps) {
  const inputClasses = `
    block w-full p-2 sm:p-3 border-2 rounded-xl text-sm sm:text-base
    focus:outline-none focus:ring-2 focus:ring-primary
    ${
      error
        ? "border-red-300 focus:border-red-500"
        : "border-gray-300 focus:border-primary"
    }
    ${className}
  `;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
      {error && <p className="text-red-500 text-xs sm:text-sm">{error}</p>}
      {helperText && !error && (
        <p className="text-gray-500 text-xs sm:text-sm">{helperText}</p>
      )}
    </div>
  );
}
