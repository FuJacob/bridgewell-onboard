import React from "react";

interface SuccessModalProps {
  isOpen: boolean;
  loginKey: string;
  onClose: () => void;
}

export default function SuccessModal({
  isOpen,
  loginKey,
  onClose,
}: SuccessModalProps) {
  if (!isOpen) return null;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(loginKey);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-primary">
          Form Created Successfully!
        </h1>

        <p className="text-gray-600 mb-6">Here is your client login key:</p>

        <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mb-4">
          <p className="text-xl font-mono font-bold text-primary break-all">
            {loginKey}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopyToClipboard}
            className="flex-1 bg-secondary hover:bg-secondary/90 text-white px-4 py-3 rounded-xl font-medium transition-colors"
          >
            Copy Code
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
