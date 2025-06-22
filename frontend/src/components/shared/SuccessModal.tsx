import React from "react";
import Image from "next/image";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-24 bg-gray-200 rounded-full px-4 py-2 mb-4 mx-auto">
          <Image
            src="/logo-bridgewell.png"
            alt="Bridgewell Financial Logo"
            width={80}
            height={80}
            style={{ width: "100%", height: "auto" }}
          />
        </div>
        <h1 className="text-3xl font-bold mb-6 text-primary">
          Client Form Generated Successfully!
        </h1>
        <p className="text-lg mb-2">Here is your client login key:</p>
        <div className="flex items-center justify-center gap-2">
          <p className="text-3xl font-mono bg-gray-100 p-6 rounded-2xl mt-4 border-2 border-secondary">
            {loginKey}
          </p>
          <button
            onClick={handleCopyToClipboard}
            className="ml-2 bg-secondary text-white px-4 py-2 rounded-xl font-bold hover:bg-secondary-DARK transition"
            title="Copy to clipboard"
          >
            📋 Copy Code
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-8 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
