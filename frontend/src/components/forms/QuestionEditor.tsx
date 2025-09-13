import React from "react";
import { FormQuestion } from "@/types";
import {
  FaArrowUp,
  FaArrowDown,
  FaTimes,
  FaGripVertical,
} from "react-icons/fa";
import Textarea from "../ui/Textarea";

interface QuestionEditorProps {
  question: FormQuestion;
  index: number;
  totalQuestions: number;
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
  // New optional flag to indicate editor is in template editing mode
  isTemplateMode?: boolean;
}

export default function QuestionEditor({
  question,
  index,
  totalQuestions,
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
  isTemplateMode = false,
}: QuestionEditorProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onTemplateUpload(index, e.target.files);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FaGripVertical className="text-gray-400 w-4 h-4" />
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{index + 1}</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {question.response_type === 'notice' ? 'Notice' : `Question ${index + 1}`}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onMoveQuestionUp(index)}
            disabled={index === 0}
            className={`p-2 rounded-lg transition-colors ${
              index === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-500 hover:text-primary hover:bg-gray-100"
            }`}
            title="Move up"
          >
            <FaArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMoveQuestionDown(index)}
            disabled={index === totalQuestions - 1}
            className={`p-2 rounded-lg transition-colors ${
              index === totalQuestions - 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-500 hover:text-primary hover:bg-gray-100"
            }`}
            title="Move down"
          >
            <FaArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemoveQuestion(index)}
            className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors ml-1"
            title="Remove question"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Question Text */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Question Text
          </label>
          <input
            type="text"
            value={question.question || ''}
            onChange={(e) => onUpdateQuestion(index, e.target.value)}
            placeholder="What would you like to ask?"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
          />
        </div>

        {/* Description and Link Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <Textarea
              value={question.description || ''}
              onChange={(e) => onUpdateDescription(index, e.target.value)}
              placeholder="Add helpful context or instructions"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reference Link{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={question.link || ""}
              onChange={(e) => onUpdateLink(index, e.target.value)}
              placeholder="https://example.com/reference"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
            />
          </div>
        </div>

        {/* Response Type and Due Date Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Response Type
            </label>
            <select
              value={question.response_type || ''}
              onChange={(e) => onUpdateResponseType(index, e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base bg-white"
            >
              <option value="text">Text Response</option>
              <option value="file">File Upload</option>
              <option value="notice">No Response</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Due Date{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={question.due_date || ''}
              onChange={(e) => onUpdateDueDate(index, e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
            />
          </div>
        </div>

        {/* Template Upload for File & Notice Questions */}
        {(question.response_type === "file" || question.response_type === "notice") && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <label className="block text-sm font-semibold text-blue-800 mb-2">
              📎 Template Document{" "}
              <span className="text-blue-600 font-normal">(optional)</span>
            </label>
            {!isTemplateMode ? (
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.png,.xls,.xlsx,.xlsm"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-white"
              />
            ) : (
              <div className="text-sm text-blue-700">
                File templates are disabled while editing templates.
              </div>
            )}
            {question.templates && question.templates.length > 0 && (
              <div className="mt-2 space-y-2">
                {question.templates.map((template, templateIndex) => (
                  <div key={template.fileName + templateIndex} className="flex items-center justify-between bg-blue-100 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-800">📄</span>
                      <span className="text-sm font-medium text-blue-700">
                        {template.fileName}
                      </span>
                    </div>
                    {onDeleteTemplate && !isTemplateMode && (
                      <button
                        onClick={() => onDeleteTemplate(index, templateIndex)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1 rounded transition-colors"
                        title="Delete template file"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
