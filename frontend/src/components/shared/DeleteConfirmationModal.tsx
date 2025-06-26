import React from "react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  warningMessage?: string;
  confirmButtonText?: string;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmationModal({
  isOpen,
  title,
  message,
  warningMessage,
  confirmButtonText = "Delete",
  isDeleting = false,
  onClose,
  onConfirm,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
    >
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        <h2 className="text-xl font-bold mb-4 text-primary">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        {warningMessage && (
          <p className="text-sm text-red-600 mb-6">{warningMessage}</p>
        )}
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-2 rounded-xl font-bold border-2 border-gray-300 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              confirmButtonText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
