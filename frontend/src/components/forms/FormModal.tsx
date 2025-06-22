import React from "react";
import QuestionEditor from "./QuestionEditor";

interface Question {
  question: string;
  description: string;
  responseType: string;
  dueDate: string;
  template?: {
    fileName: string;
    fileId: string;
    uploadedAt: string;
    fileObject?: File;
  } | null;
}

interface FormModalProps {
  isOpen: boolean;
  clientName: string;
  organization: string;
  questions: Question[];
  formError: string | null;
  isGenerating: boolean;
  onClose: () => void;
  onClientNameChange: (value: string) => void;
  onOrganizationChange: (value: string) => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (
    index: number,
    field: keyof Question,
    value: string
  ) => void;
  onRemoveQuestion: (index: number) => void;
  onMoveQuestionUp: (index: number) => void;
  onMoveQuestionDown: (index: number) => void;
  onTemplateUpload: (index: number, file: File) => void;
  onSubmit: () => void;
  onSaveAsTemplate: () => void;
}

export default function FormModal({
  isOpen,
  clientName,
  organization,
  questions,
  formError,
  isGenerating,
  onClose,
  onClientNameChange,
  onOrganizationChange,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion,
  onMoveQuestionUp,
  onMoveQuestionDown,
  onTemplateUpload,
  onSubmit,
  onSaveAsTemplate,
}: FormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
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

        {formError && (
          <div className="p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded mb-4 sm:mb-6 text-sm sm:text-base">
            <p>{formError}</p>
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">
                Client Name
              </label>
              <input
                type="text"
                placeholder="Enter client name"
                value={clientName}
                onChange={(e) => onClientNameChange(e.target.value)}
                className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">
                Organization
              </label>
              <input
                type="text"
                placeholder="Enter organization name"
                value={organization}
                onChange={(e) => onOrganizationChange(e.target.value)}
                className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
              />
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

            {questions.map((question, index) => (
              <QuestionEditor
                key={index}
                question={question}
                index={index}
                totalQuestions={questions.length}
                onUpdate={onUpdateQuestion}
                onRemove={onRemoveQuestion}
                onMoveUp={onMoveQuestionUp}
                onMoveDown={onMoveQuestionDown}
                onTemplateUpload={onTemplateUpload}
              />
            ))}

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
