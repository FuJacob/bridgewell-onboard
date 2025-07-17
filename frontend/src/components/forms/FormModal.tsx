import React, { useState, useEffect } from "react";
import { FormQuestion } from "@/types";
import QuestionEditor from "./QuestionEditor";

interface FormModalProps {
  isOpen: boolean;
  clientName: string;
  organization: string;
  email: string;
  clientDescription: string;
  questions: FormQuestion[];
  formError: string | null;
  isGenerating: boolean;
  onClose: () => void;
  onClientNameChange: (value: string) => void;
  onOrganizationChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onClientDescriptionChange: (value: string) => void;
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
  onSubmit: () => void;
  onSaveAsTemplate: () => void;
}

export default function FormModal({
  isOpen,
  clientName,
  organization,
  email,
  questions,
  clientDescription,
  formError,
  isGenerating,
  onClose,
  onClientNameChange,
  onOrganizationChange,
  onEmailChange,
  onClientDescriptionChange,
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
}: FormModalProps) {
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    if (formError) setShowErrorModal(true);
  }, [formError]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      {/* Error Modal */}
      {formError && showErrorModal && (
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
            <p className="text-gray-700 mb-6">{formError}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-medium transition-colors w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 max-w-4xl w-full overflow-y-auto max-h-[95vh] sm:h-5/6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary">
            Create New Client Form
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl p-1"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row gap-y-4 sm:gap-x-6">
            {/* Left Column: Name, Org, Email */}
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
                      onChange={(e) => onClientNameChange(e.target.value)}
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
                      onChange={(e) => onOrganizationChange(e.target.value)}
                      className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="johnsmith@bridgewellfinancial.com"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Right Column: Description */}
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-medium mb-1">
                  Description of Client
                </label>
                <textarea
                  placeholder="John Smith is a client of Bridgewell Financial"
                  value={clientDescription}
                  onChange={(e) => onClientDescriptionChange(e.target.value)}
                  className="mt-1 block w-full h-[208px] p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-primary">
                Questions
              </h3>
              <button
                onClick={onAddQuestion}
                className="w-full sm:w-auto bg-secondary text-white px-3 sm:px-4 py-2 rounded-xl font-medium text-sm sm:text-base"
              >
                + Add Question
              </button>
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
                />
              ))}
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-bold border-2 border-gray-300 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={onSaveAsTemplate}
                disabled={isGenerating}
                className="bg-secondary text-white px-6 py-3 rounded-xl font-bold hover:bg-secondary-DARK transition flex items-center gap-2"
                title="Save these questions as a template"
              >
                Save as Template
              </button>
              <button
                onClick={onSubmit}
                disabled={isGenerating}
                className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  "Generate Form"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
