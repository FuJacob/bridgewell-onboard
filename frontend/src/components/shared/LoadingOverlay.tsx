import React from "react";

interface LoadingOverlayProps {
  isOpen: boolean;
  title: string;
  message: string;
  zIndex?: number;
}

export default function LoadingOverlay({
  isOpen,
  title,
  message,
  zIndex = 100000,
}: LoadingOverlayProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4"
      style={{ zIndex }}
    >
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-bold mb-2 text-primary">{title}</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
