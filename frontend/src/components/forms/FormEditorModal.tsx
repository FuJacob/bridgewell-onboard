import React, { useState, useEffect } from "react";
import { Template, FormQuestion } from "@/types";
import { FaSave } from "react-icons/fa";
import QuestionEditor from "./QuestionEditor";

export interface FormEditorModalProps {
  isOpen: boolean;
  mode: "create" | "editTemplate";
  title?: string;
  
  // For create mode - client information
  clientName?: string;
  organization?: string;
  email?: string;
  clientDescription?: string;
  onClientNameChange?: (value: string) => void;
  onOrganizationChange?: (value: string) => void;
  onEmailChange?: (value: string) => void;
  onClientDescriptionChange?: (value: string) => void;
  // New admin email field for create mode
  adminEmail?: string;
  onAdminEmailChange?: (value: string) => void;
  
  // For edit template mode
  template?: Template | null;
  templateName?: string;
  onTemplateNameChange?: (value: string) => void;
  
  // Common for both modes
  questions: FormQuestion[];
  error?: string | null;
  isProcessing: boolean;
  uploadProgress?: string | null;
  
  // Event handlers
  onClose: () => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (index: number, value: string) => void;
  onUpdateDescription: (index: number, value: string) => void;
  onUpdateResponseType: (index: number, value: string) => void;
  onUpdateDueDate: (index: number, value: string) => void;
  onUpdateLink: (index: number, value: string) => void;
  onRemoveQuestion: (index: number) => void;
  onMoveQuestionUp: (index: number) => void;
  onMoveQuestionDown: (index: number) => void;
  onTemplateUpload: (index: number, files: FileList) => void;
  onDeleteTemplate?: (questionIndex: number, templateIndex: number) => void;
  
  // Different submit handlers based on mode
  onSubmit: () => void;
  onSaveAsTemplate?: () => void; // Only for create mode
}

export default function FormEditorModal({
  isOpen,
  mode,
  title,
  clientName = "",
  organization = "",
  email = "",
  clientDescription = "",
  onClientNameChange,
  onOrganizationChange,
  onEmailChange,
  onClientDescriptionChange,
  adminEmail = "",
  onAdminEmailChange,
  template,
  templateName: propTemplateName,
  onTemplateNameChange,
  questions,
  error,
  isProcessing,
  uploadProgress,
  onClose,
  onAddQuestion,
  onUpdateQuestion,
  onUpdateDescription,
  onUpdateResponseType,
  onUpdateDueDate,
  onUpdateLink,
  onRemoveQuestion,
  onMoveQuestionUp,
  onMoveQuestionDown,
  onTemplateUpload,
  onDeleteTemplate,
  onSubmit,
  onSaveAsTemplate,
}: FormEditorModalProps) {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [internalTemplateName, setInternalTemplateName] = useState("");

  // Handle template name for edit mode
  const currentTemplateName = mode === "editTemplate" 
    ? (propTemplateName || internalTemplateName)
    : "";

  const handleTemplateNameChange = (value: string) => {
    if (mode === "editTemplate") {
      setInternalTemplateName(value);
      onTemplateNameChange?.(value);
    }
  };

  useEffect(() => {
    if (mode === "editTemplate" && template && isOpen) {
      const name = template.template_name || "";
      setInternalTemplateName(name);
      onTemplateNameChange?.(name);
    }
  }, [template, isOpen, mode, onTemplateNameChange]);

  useEffect(() => {
    if (error) setShowErrorModal(true);
  }, [error]);

  if (!isOpen) return null;

  const modalTitle = title || (mode === "create" ? "Create New Client Form" : `Edit Template: ${template?.template_name || ""}`);
  const submitButtonText = mode === "create" ? "Generate Form" : "Save Changes";
  const processingText = mode === "create" ? (uploadProgress || "Generating...") : "Saving...";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      {/* Error Modal */}
      {error && showErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl border border-red-300">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-red-700">
              Error
            </h1>
            <p className="text-gray-700 mb-6">{error}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-medium transition-colors w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="relative bg-white rounded-2xl p-4 sm:p-6 lg:p-8 max-w-4xl w-full overflow-y-auto max-h-[95vh] sm:h-5/6">
        {mode === "create" && isProcessing && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-6">
            <div className="w-10 h-10 border-2 border-gray-400 border-t-primary rounded-full animate-spin mb-3"></div>
            <p className="text-gray-800 font-medium">Preparing and uploading files…</p>
            <p className="text-gray-600 text-sm mt-1">Large files may take several minutes. Please keep this tab open.</p>
          </div>
        )}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary">
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl p-1"
          >
            ×
          </button>
        </div>

        <div className={`space-y-4 sm:space-y-6 ${mode === "create" && isProcessing ? 'pointer-events-none opacity-60' : ''}`}>
          {/* Client Information Section - Only for create mode */}
          {mode === "create" && (
            <div className="flex flex-col sm:flex-row gap-y-4 sm:gap-x-6">
              <div className="flex flex-col items-between justify-center w-full sm:flex-row gap-y-4 sm:gap-x-6">
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:gap-4">
                    <div className="flex-1">
                      <label className="block text-xs sm:text-sm font-medium mb-1">
                        Client Name
                      </label>
                      <input
                        type="text"
                        placeholder="John Smith"
                        value={clientName}
                        onChange={(e) => onClientNameChange?.(e.target.value)}
                        className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs sm:text-sm font-medium mb-1">
                        Organization
                      </label>
                      <input
                        type="text"
                        placeholder="Bridgewell Financial"
                        value={organization}
                        onChange={(e) => onOrganizationChange?.(e.target.value)}
                        className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      placeholder="admin@example.com"
                      value={adminEmail}
                      onChange={(e) => onAdminEmailChange?.(e.target.value)}
                      className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="johnsmith@bridgewellfinancial.com"
                      value={email}
                      onChange={(e) => onEmailChange?.(e.target.value)}
                      className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Description of Client
                  </label>
                  <textarea
                    placeholder="John Smith is a client of Bridgewell Financial"
                    value={clientDescription}
                    onChange={(e) => onClientDescriptionChange?.(e.target.value)}
                    className="mt-1 block w-full h-[208px] p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Template Name Section - Only for edit template mode */}
          {mode === "editTemplate" && (
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">
                Template Name
              </label>
              <input
                type="text"
                placeholder="Enter template name"
                value={currentTemplateName}
                onChange={(e) => handleTemplateNameChange(e.target.value)}
                className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Questions Section */}
          <div className="border-t border-gray-200 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-primary">
                Questions
              </h3>
            </div>

            {questions.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-gray-500">
                  No questions added yet. Click &quot;Add Question&quot; to get
                  started.
                </p>
              </div>
            )}

            <div className="space-y-6">
              {questions.map((q, index) => (
                <QuestionEditor
                  key={index}
                  question={q}
                  index={index}
                  totalQuestions={questions.length}
                  onUpdateQuestion={onUpdateQuestion}
                  onUpdateDescription={onUpdateDescription}
                  onUpdateResponseType={onUpdateResponseType}
                  onUpdateDueDate={onUpdateDueDate}
                  onUpdateLink={onUpdateLink}
                  onRemoveQuestion={onRemoveQuestion}
                  onMoveQuestionUp={onMoveQuestionUp}
                  onMoveQuestionDown={onMoveQuestionDown}
                  onTemplateUpload={onTemplateUpload}
                  onDeleteTemplate={onDeleteTemplate}
                  isTemplateMode={mode === "editTemplate"}
                />
              ))}
            </div>

            {mode === "editTemplate" && (
              <div className="mt-4">
                <button
                  onClick={onAddQuestion}
                  className="w-full sm:w-auto bg-secondary text-white px-3 sm:px-4 py-2 rounded-xl font-medium text-sm sm:text-base"
                >
                  + Add Question
                </button>
              </div>
            )}
            {mode === "create" && (
              <div className="mt-4">
                <button
                  onClick={onAddQuestion}
                  className="w-full sm:w-auto bg-secondary text-white px-3 sm:px-4 py-2 rounded-xl font-medium text-sm sm:text-base"
                >
                  + Add Question
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-bold border-2 border-gray-300 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              
              {/* Save as Template button - Only for create mode */}
              {mode === "create" && onSaveAsTemplate && (
                <button
                  onClick={onSaveAsTemplate}
                  disabled={isProcessing}
                  className="bg-secondary text-white px-6 py-3 rounded-xl font-bold hover:bg-secondary-DARK transition flex items-center gap-2"
                  title="Save these questions as a template"
                >
                  Save as Template
                </button>
              )}

              {/* Main submit button */}
              <button
                onClick={onSubmit}
                disabled={isProcessing}
                className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {processingText}
                  </>
                ) : (
                  <>
                    {mode === "editTemplate" && <FaSave className="w-4 h-4" />}
                    {submitButtonText}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}