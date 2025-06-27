import React from "react";
import { Question } from "@/types";
import Textarea from "../ui/Textarea";
import FileUpload from "../ui/FileUpload";
import Button from "../ui/Button";
import ErrorMessage from "../shared/ErrorMessage";

interface QuestionCardProps {
  question: Question;
  index: number;
  isSubmitted: boolean;
  isSubmitting: boolean;
  error?: string | null;
  textResponse?: string;
  selectedFile?: File | null;
  onTextChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onSubmit: () => void;
  showAdminPanel?: boolean;
  onRedoQuestion?: () => void;
}

export default function QuestionCard({
  question,
  index,
  isSubmitted,
  isSubmitting,
  error,
  textResponse = "",
  selectedFile,
  onTextChange,
  onFileChange,
  onSubmit,
  showAdminPanel = false,
  onRedoQuestion,
}: QuestionCardProps) {
  const canSubmit =
    question.response_type === "text"
      ? textResponse.trim() !== ""
      : selectedFile !== null;

  return (
    <div
      className={`bg-white rounded-xl shadow-md p-4 sm:p-6 transition-all duration-300${
        isSubmitted ? " bg-green-50 border-l-4 border-green-500" : ""
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 lg:gap-4">
        <h2 className="text-lg sm:text-xl font-semibold mb-2">
          {question.question}
          {isSubmitted && (
            <span className="ml-2 text-green-600 text-sm font-normal">
              ✓ Completed
            </span>
          )}
        </h2>
        {showAdminPanel && (
          <div className="bg-red-200 flex flex-col gap-2 justify-center items-center p-2 sm:p-4 rounded-3xl shrink-0">
            <h3 className="text-red-400 font-semibold text-xs sm:text-sm">
              Admin Panel
            </h3>
            <Button variant="danger" size="sm" onClick={onRedoQuestion}>
              Make client redo this question
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm sm:text-base text-gray-600 mb-4">
        {question.description}
      </p>

      {/* Download Template Button for file-type questions with templates */}
      {question.response_type === "file" &&
        question.templates &&
        question.templates.length > 0 &&
        question.templates.some((t) => t.fileId && t.fileId.trim() !== "") && (
          <div className="mb-2">
            <a
              href={`/api/client/download-templates?fileIds=${encodeURIComponent(
                question.templates
                  .filter((t) => t.fileId && t.fileId.trim() !== "")
                  .map((t) => t.fileId)
                  .join(",")
              )}&question=${encodeURIComponent(question.question)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-secondary text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-secondary-DARK transition text-sm sm:text-base"
            >
              Download Templates (
              {
                question.templates.filter(
                  (t) => t.fileId && t.fileId.trim() !== ""
                ).length
              }{" "}
              file
              {question.templates.filter(
                (t) => t.fileId && t.fileId.trim() !== ""
              ).length > 1
                ? "s"
                : ""}
              )
            </a>
          </div>
        )}

      {/* Question Input */}
      {question.response_type === "text" ? (
        <Textarea
          value={textResponse}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Type your response here..."
          rows={4}
          disabled={isSubmitting || isSubmitted}
        />
      ) : (
        <FileUpload
          selectedFile={selectedFile}
          onFileChange={onFileChange}
          disabled={isSubmitting || isSubmitted}
          id={`file-input-${index}`}
        />
      )}

      {error && <ErrorMessage message={error} className="mt-2" />}

      <div className="mt-4">
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || isSubmitted || !canSubmit}
          loading={isSubmitting}
          className={`w-full sm:w-auto ${
            isSubmitted
              ? "bg-green-100 text-green-600 cursor-default hover:bg-green-100"
              : ""
          }`}
        >
          {isSubmitted ? "Submitted" : "Submit Response"}
        </Button>
      </div>
    </div>
  );
}
