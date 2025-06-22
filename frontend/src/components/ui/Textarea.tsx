import React from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Textarea({
  label,
  error,
  helperText,
  className = "",
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaClasses = `
    block w-full p-2 sm:p-3 border-2 rounded-xl text-sm sm:text-base
    focus:outline-none focus:ring-2 focus:ring-primary resize-vertical
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
      <textarea className={textareaClasses} rows={rows} {...props} />
      {error && <p className="text-red-500 text-xs sm:text-sm">{error}</p>}
      {helperText && !error && (
        <p className="text-gray-500 text-xs sm:text-sm">{helperText}</p>
      )}
    </div>
  );
}
