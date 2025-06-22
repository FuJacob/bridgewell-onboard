import React from "react";

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export default function ErrorMessage({
  message,
  className = "",
}: ErrorMessageProps) {
  return (
    <div
      className={`p-3 sm:p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm sm:text-base ${className}`}
    >
      <p>{message}</p>
    </div>
  );
}
