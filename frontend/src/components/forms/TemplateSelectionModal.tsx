import React from "react";
import { Template } from "@/types";
import { FaPlus, FaTimes } from "react-icons/fa";

interface TemplateSelectionModalProps {
  isOpen: boolean;
  templates: Template[];
  isLoading: boolean;
  onClose: () => void;
  onSelectBlank: () => void;
  onSelectTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template, e: React.MouseEvent) => void;
}

export default function TemplateSelectionModal({
  isOpen,
  templates,
  isLoading,
  onClose,
  onSelectBlank,
  onSelectTemplate,
  onDeleteTemplate,
}: TemplateSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-primary">Choose Template</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3"></div>
            <span>Loading templates...</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {/* Blank Template Option */}
            <button
              onClick={onSelectBlank}
              className="w-full p-4 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <FaPlus className="w-5 h-5" />
                <div>
                  <h3 className="font-semibold">Create Blank Form</h3>
                  <p className="text-sm text-blue-100">
                    Start with an empty form
                  </p>
                </div>
              </div>
            </button>

            {/* Saved Templates */}
            {templates.map((template) => {
              let questionCount = 0;
              try {
                if (
                  template.questions &&
                  typeof template.questions === "string"
                ) {
                  questionCount = JSON.parse(template.questions).length;
                }
              } catch (err) {
                console.error("Error parsing template questions:", err);
                questionCount = 0;
              }

              return (
                <div
                  key={template.id}
                  className="w-full p-4 border border-gray-200 rounded-xl hover:border-primary transition-colors cursor-pointer group"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {questionCount} questions •{" "}
                        {new Date(template.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => onDeleteTemplate(template, e)}
                      className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {templates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No saved templates</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
