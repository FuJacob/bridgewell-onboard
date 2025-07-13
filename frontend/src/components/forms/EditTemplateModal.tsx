import React, { useState, useEffect } from "react";
import { Template, FormQuestion } from "@/types";
import { FaSave } from "react-icons/fa";
import QuestionEditor from "./QuestionEditor";

interface EditTemplateModalProps {
  isOpen: boolean;
  template: Template | null;
  onClose: () => void;
  onSave: (
    templateId: string,
    templateName: string,
    questions: FormQuestion[]
  ) => void;
  isSaving: boolean;
}

export default function EditTemplateModal({
  isOpen,
  template,
  onClose,
  onSave,
  isSaving,
}: EditTemplateModalProps) {
  const [templateName, setTemplateName] = useState("");
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (template && isOpen) {
      setTemplateName(template.template_name || "");
      try {
        const templateQuestions = JSON.parse(template.questions || "[]");
        setQuestions(Array.isArray(templateQuestions) ? templateQuestions : []);
      } catch (err) {
        console.error("Error parsing template questions:", err);
        setQuestions([]);
        setError("Failed to load template questions");
      }
    }
  }, [template, isOpen]);

  const handleSave = () => {
    if (!template) return;

    if (!templateName.trim()) {
      setError("Template name is required");
      return;
    }

    if (questions.length === 0) {
      setError("At least one question is required");
      return;
    }

    // Check if all questions have content
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        setError(`Question ${i + 1} is required`);
        return;
      }
    }

    setError(null);
    onSave(String(template.id), templateName, questions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        description: "",
        response_type: "text",
        due_date: "",
        templates: null,
        link: "",
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].question = value;
    setQuestions(newQuestions);
  };

  const updateDescription = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].description = value;
    setQuestions(newQuestions);
  };

  const updateResponseType = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].response_type = value;
    setQuestions(newQuestions);
  };

  const updateDueDate = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].due_date = value;
    setQuestions(newQuestions);
  };

  const updateLink = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].link = value;
    setQuestions(newQuestions);
  };

  const moveQuestionUp = (index: number) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[index - 1];
    newQuestions[index - 1] = temp;
    setQuestions(newQuestions);
  };

  const moveQuestionDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[index + 1];
    newQuestions[index + 1] = temp;
    setQuestions(newQuestions);
  };

  const handleTemplateUpload = (index: number, files: FileList) => {
    if (!files || files.length === 0) return;
    const newQuestions = [...questions];
    const now = new Date().toISOString();
    const templateFiles = Array.from(files).map((file) => ({
      fileName: file.name,
      fileId: "",
      uploadedAt: now,
      fileObject: file,
    }));

    if (
      Array.isArray(newQuestions[index].templates) &&
      newQuestions[index].templates.length > 0
    ) {
      newQuestions[index].templates = [
        ...newQuestions[index].templates,
        ...templateFiles,
      ];
    } else {
      newQuestions[index].templates = templateFiles;
    }
    setQuestions(newQuestions);
  };

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 max-w-4xl w-full overflow-y-auto max-h-[95vh] sm:h-5/6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary">
            Edit Template: {template.template_name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl p-1"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Template Name */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">
              Template Name
            </label>
            <input
              type="text"
              placeholder="Enter template name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
            />
          </div>

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
              <button
                onClick={addQuestion}
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
                  onUpdateQuestion={updateQuestion}
                  onUpdateDescription={updateDescription}
                  onUpdateResponseType={updateResponseType}
                  onUpdateDueDate={updateDueDate}
                  onUpdateLink={updateLink}
                  onRemoveQuestion={removeQuestion}
                  onMoveQuestionUp={moveQuestionUp}
                  onMoveQuestionDown={moveQuestionDown}
                  onTemplateUpload={handleTemplateUpload}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold border-2 border-gray-300 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
