import React from "react";

interface SaveTemplateModalProps {
  isOpen: boolean;
  templateName: string;
  templateStatus: string | null;
  isSavingTemplate: boolean;
  onClose: () => void;
  onTemplateNameChange: (value: string) => void;
  onSave: () => void;
}

export default function SaveTemplateModal({
  isOpen,
  templateName,
  templateStatus,
  isSavingTemplate,
  onClose,
  onTemplateNameChange,
  onSave,
}: SaveTemplateModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
    >
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        <h2 className="text-xl font-bold mb-4 text-primary">
          Save as Template
        </h2>
        <input
          type="text"
          placeholder="Enter template name"
          value={templateName}
          onChange={(e) => onTemplateNameChange(e.target.value)}
          className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-base mb-4"
        />
        {templateStatus && (
          <div
            className={`mb-4 text-sm ${
              templateStatus.includes("success")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {templateStatus}
          </div>
        )}
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl font-bold border-2 border-gray-300 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSavingTemplate}
            className="bg-secondary text-white px-6 py-2 rounded-xl font-bold hover:bg-secondary-DARK transition flex items-center gap-2"
          >
            {isSavingTemplate ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Save Template"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
