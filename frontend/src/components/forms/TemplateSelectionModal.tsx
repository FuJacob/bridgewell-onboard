import React from "react";

interface Template {
  id: string;
  created_at: string;
  name: string;
  questions: string;
}

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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full text-center">
        <h2 className="text-2xl font-bold mb-6 text-primary">
          Select Template
        </h2>
        <p className="text-gray-600 mb-6">
          Choose a template to start with or create a blank form
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3">Loading templates...</span>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Blank Template Option */}
            <button
              onClick={onSelectBlank}
              className="w-full p-4 border-2 border-gray-200 hover:border-primary rounded-xl text-left transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-primary">
                    Blank Form
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Start with an empty form and add your own questions
                  </p>
                </div>
                <span className="text-gray-400">→</span>
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
                  className="w-full p-4 border-2 border-gray-200 hover:border-primary rounded-xl text-left transition-colors relative cursor-pointer"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-primary">
                        {template.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {questionCount} questions • Created{" "}
                        {new Date(template.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">→</span>
                      <button
                        onClick={(e) => onDeleteTemplate(template, e)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete template"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold border-2 border-gray-300 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
