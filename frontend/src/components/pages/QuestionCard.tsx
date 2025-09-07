import React, { useState } from "react";
import { AppQuestion } from "@/types";
import Textarea from "../ui/Textarea";
import FileUpload from "../ui/FileUpload";
import Button from "../ui/Button";
import ErrorMessage from "../shared/ErrorMessage";
import { FaCheckCircle, FaDownload, FaRedo, FaExternalLinkAlt } from "react-icons/fa";

interface QuestionCardProps {
  question: AppQuestion;
  index: number;
  isSubmitted: boolean;
  isSubmitting: boolean;
  error?: string | null;
  textResponse?: string;
  selectedFiles?: File[] | null;
  onTextChange: (value: string) => void;
  onFileChange: (files: File[] | null) => void;
  onSubmit: () => void;
  showAdminPanel?: boolean;
  onRedoQuestion?: () => void;
  loginKey?: string;
}

export default function QuestionCard({
  question,
  index,
  isSubmitted,
  isSubmitting,
  error,
  textResponse = "",
  selectedFiles,
  onTextChange,
  onFileChange,
  onSubmit,
  showAdminPanel = false,
  onRedoQuestion,
  loginKey,
}: QuestionCardProps) {
  const [isResetting, setIsResetting] = useState(false);
  const canSubmit =
    question.response_type === "text"
      ? textResponse.trim() !== ""
      : question.response_type === 'file'
      ? Array.isArray(selectedFiles) && selectedFiles.length > 0
      : false;

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl ${
        isSubmitted ? "bg-gradient-to-r from-green-50 to-emerald-50" : ""
      }`}
    >
      {/* Header Section */}
      <div className="p-6 pb-4 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`flex-shrink-0 p-4 rounded-full flex items-center justify-center font-black text-5xl text-primary`}
              >
                {index + 1}
              </div>
              <div className="flex-1">
                {question.response_type === 'notice' && (
                  <div className="mb-2 inline-flex items-center gap-2 text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded">
                    Notice
                  </div>
                )}
                <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                  {question.question || ''}
                </h2>

                {question.response_type !== 'notice' && (
                  <div className="mb-3 p-2 text-xs bg-red-50 border-l-4 border-red-400 text-red-700 rounded-r-lg w-fit">
                    Due Date:{" "}
                    {question.due_date
                      ? new Date(question.due_date).toLocaleString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A"}
                  </div>
                )}
                {question.link && question.response_type !== 'notice' && (
                  <div className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-700 font-medium text-sm">
                        Reference Link:
                      </span>
                      <a
                        href={question.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        {question.link.replace(/^https?:\/\//, "")}
                      </a>
                      <FaExternalLinkAlt className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                )}
                {question.description && (
                  <p className="text-gray-600 leading-relaxed">
                    {question.description ? (
                      question.description
                    ) : (
                      <span className="text-gray-400 italic">
                        No description provided.
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Admin panel removed; unified controls are shown below */}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* Download Template Button */}
        {question.response_type === "file" &&
          question.templates &&
          question.templates.length > 0 &&
          question.templates.some(
            (t) => t.fileId && t.fileId.trim() !== ""
          ) && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaDownload className="text-blue-600 w-4 h-4" />
                  <h4 className="text-blue-800 font-semibold text-sm">
                    Required Templates
                  </h4>
                </div>
                <p className="text-blue-700 text-sm mb-3">
                  Download the required template files before completing this
                  question.
                </p>
                <a
                  href={`/api/client/download-templates?fileIds=${encodeURIComponent(
                    question.templates
                      .filter((t) => t.fileId && t.fileId.trim() !== "")
                      .map((t) => t.fileId)
                      .join(",")
                  )}&question=${encodeURIComponent(question.question || "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <FaDownload className="w-4 h-4" />
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
            </div>
          )}

        {/* Response Input */}
        {question.response_type !== 'notice' && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Your Response
            </label>
            {question.response_type === "text" ? (
              <Textarea
                value={textResponse}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Type your response here..."
                rows={4}
                disabled={isSubmitting || isSubmitted}
                className="resize-none"
              />
            ) : (
              <FileUpload
                selectedFiles={selectedFiles || null}
                onFileChange={onFileChange}
                disabled={isSubmitting || isSubmitted}
                id={`file-input-${index}`}
                multiple
              />
            )}
          </div>
        )}

        {error && <ErrorMessage message={error} className="mb-4" />}

        {/* Submit / Reset Buttons */}
        <div className="flex justify-end gap-3">
          {isSubmitted && onRedoQuestion && question.response_type !== 'notice' && (
            <Button
              variant="danger"
              onClick={async () => {
                try {
                  setIsResetting(true);
                  await onRedoQuestion();
                } finally {
                  setIsResetting(false);
                }
              }}
              disabled={isSubmitting || isResetting}
              size="lg"
              className="px-6 py-3 font-semibold"
              loading={isResetting}
            >
              Reset submission
            </Button>
          )}
          {isSubmitted && question.response_type !== 'notice' && (
            <Button
              variant="primary"
              onClick={() => {
                const qt = encodeURIComponent(question.question || "");
                const k = encodeURIComponent(loginKey || (question as any).login_key || '');
                window.open(`/api/admin/download-answers?key=${k}&question=${qt}`, "_blank");
              }}
              disabled={isSubmitting || isResetting}
              size="lg"
              className="px-6 py-3 font-semibold"
            >
              Download previous responses
            </Button>
          )}
          {question.response_type !== 'notice' && (
            <Button
              onClick={onSubmit}
              disabled={isSubmitting || !canSubmit}
              loading={isSubmitting}
              size="lg"
              className={`px-8 py-3 font-semibold ${
                isSubmitted
                  ? "!bg-green-500 !text-white !border-green-500 cursor-default hover:!bg-green-500 hover:!border-green-500"
                  : !canSubmit
                  ? "!bg-gray-300 !text-gray-500 !border-gray-300 cursor-not-allowed hover:!bg-gray-300 hover:!border-gray-300 hover:!text-gray-500"
                  : "shadow-lg hover:shadow-xl"
              }`}
            >
              {isSubmitted ? "Submitted" : "Submit Response"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
