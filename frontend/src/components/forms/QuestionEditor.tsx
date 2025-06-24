import React from "react";

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

interface QuestionEditorProps {
  question: Question;
  index: number;
  totalQuestions: number;
  onUpdate: (index: number, field: keyof Question, value: string) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onTemplateUpload: (index: number, file: File) => void;
}

export default function QuestionEditor({
  question,
  index,
  totalQuestions,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onTemplateUpload,
}: QuestionEditorProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onTemplateUpload(index, file);
    }
  };

  return (
    <div className="mb-4 sm:mb-6 p-4 sm:p-6 border-2 border-gray-200 rounded-xl bg-gray-50">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0 mb-4">
        <span className="bg-primary text-white text-xs sm:text-sm py-1 px-2 sm:px-3 rounded-full">
          Question {index + 1}
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className={`p-1 sm:p-2 rounded text-sm sm:text-base ${
              index === 0 ? "text-gray-400" : "text-primary hover:bg-gray-200"
            }`}
          >
            ↑
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={index === totalQuestions - 1}
            className={`p-1 sm:p-2 rounded text-sm sm:text-base ${
              index === totalQuestions - 1
                ? "text-gray-400"
                : "text-primary hover:bg-gray-200"
            }`}
          >
            ↓
          </button>
          <button
            onClick={() => onRemove(index)}
            className="bg-red-500 text-white p-1 sm:p-2 rounded-lg hover:bg-red-600 text-sm sm:text-base"
          >
            ×
          </button>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1">
            Question
          </label>
          <input
            type="text"
            value={question.question}
            onChange={(e) => onUpdate(index, "question", e.target.value)}
            placeholder="Enter your question"
            className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1">
            Description (optional)
          </label>
          <input
            type="text"
            value={question.description}
            onChange={(e) => onUpdate(index, "description", e.target.value)}
            placeholder="Add a short description or hint for this question"
            className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">
              Response Type
            </label>
            <select
              value={question.responseType}
              onChange={(e) => onUpdate(index, "responseType", e.target.value)}
              className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl bg-white text-sm sm:text-base"
            >
              <option value="text">Text Response</option>
              <option value="file">File Upload</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">
              Due Date (optional)
            </label>
            <input
              type="date"
              value={question.dueDate}
              onChange={(e) => onUpdate(index, "dueDate", e.target.value)}
              className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
            />
          </div>
        </div>

        {question.responseType === "file" && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Template Document (optional)
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.png,.xls,.xlsx,.xlsm"
              onChange={handleFileUpload}
              className="block w-full p-2 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl"
            />
            {question.template && question.template.fileName && (
              <div className="text-xs text-gray-600 mt-1">
                Uploaded: {question.template.fileName}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
