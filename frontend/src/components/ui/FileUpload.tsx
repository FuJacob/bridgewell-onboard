import React from "react";
import { FaTimes } from "react-icons/fa";

interface FileUploadProps {
  label?: string;
  error?: string;
  helperText?: string;
  selectedFiles?: File[] | null;
  onFileChange: (files: File[] | null) => void;
  accept?: string;
  disabled?: boolean;
  id?: string;
  multiple?: boolean;
}

export default function FileUpload({
  label,
  error,
  helperText = "Allowed file types: PDF, DOC, DOCX, JPG, PNG, XLS, XLSX, XLSM",
  selectedFiles,
  onFileChange,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.xlsm",
  disabled = false,
  id,
  multiple = true,
}: FileUploadProps) {
  const [dragActive, setDragActive] = React.useState(false);
  // const validateFile = (file: File): string | null => {
  //   const maxSize = 10 * 1024 * 1024; // 10MB
  //   const allowedTypes = [
  //     'application/pdf',
  //     'application/msword',
  //     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  //     'image/jpeg',
  //     'image/jpg',
  //     'image/png'
  //   ];

  //   if (file.size > maxSize) {
  //     return `File "${file.name}" is too large. Maximum size is 10MB.`;
  //   }

  //   if (!allowedTypes.includes(file.type)) {
  //     return `File type "${file.type}" is not supported. Please upload PDF, DOC, DOCX, JPG, or PNG files.`;
  //   }

  //   return null;
  // };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const merged = selectedFiles && selectedFiles.length > 0
        ? [...selectedFiles, ...newFiles]
        : newFiles;
      onFileChange(merged);
    } else {
      onFileChange(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragActive) setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(false);
    const dtFiles = e.dataTransfer?.files;
    if (dtFiles && dtFiles.length > 0) {
      const newFiles = Array.from(dtFiles);
      const merged = selectedFiles && selectedFiles.length > 0
        ? [...selectedFiles, ...newFiles]
        : newFiles;
      onFileChange(merged);
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
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center px-3 sm:px-4 py-4 sm:py-6 border-2 border-dashed rounded-lg transition-colors ${
          disabled
            ? "border-gray-200 cursor-not-allowed opacity-50"
            : error
            ? "border-red-300 cursor-pointer hover:border-red-400"
            : dragActive
            ? "border-primary cursor-copy bg-primary/5"
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
            {selectedFiles && selectedFiles.length > 0
              ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`
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
          multiple={multiple}
        />
      </label>

      {selectedFiles && selectedFiles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedFiles.map((f, idx) => (
            <span
              key={`${f.name}-${idx}`}
              className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-xs sm:text-sm px-3 py-1.5 rounded-full border border-blue-200"
            >
              <span className="truncate max-w-[160px] sm:max-w-[220px]">{f.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const next = selectedFiles.filter((_, i) => i !== idx);
                  onFileChange(next.length > 0 ? next : null);
                }}
                className="text-blue-600 hover:text-red-600 hover:bg-red-50 rounded"
                aria-label={`Remove ${f.name}`}
                title="Remove file"
                disabled={disabled}
              >
                <FaTimes className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-xs sm:text-sm">{error}</p>}
    </div>
  );
}
