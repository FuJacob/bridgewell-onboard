import React from "react";

interface FileUploadProps {
  label?: string;
  error?: string;
  helperText?: string;
  selectedFile?: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  id?: string;
}

export default function FileUpload({
  label,
  error,
  helperText = "Allowed file types: PDF, DOC, DOCX, JPG, PNG",
  selectedFile,
  onFileChange,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  disabled = false,
  id,
}: FileUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files[0]);
    } else {
      onFileChange(null);
    }
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <label
        className={`flex flex-col items-center px-3 sm:px-4 py-4 sm:py-6 border-2 border-dashed rounded-lg transition-colors ${
          disabled
            ? "border-gray-200 cursor-not-allowed opacity-50"
            : error
            ? "border-red-300 cursor-pointer hover:border-red-400"
            : "border-gray-300 cursor-pointer hover:border-primary"
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <svg
            className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mb-1 text-sm text-gray-700">
            {selectedFile
              ? selectedFile.name
              : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-gray-500">{helperText}</p>
        </div>
        <input
          id={id}
          type="file"
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
          disabled={disabled}
        />
      </label>

      {selectedFile && (
        <div className="mt-2 flex items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs sm:text-sm text-gray-700 truncate">
            File selected: {selectedFile.name}
          </span>
        </div>
      )}

      {error && <p className="text-red-500 text-xs sm:text-sm">{error}</p>}
    </div>
  );
}
