import React from "react";
import { ResponseData } from "@/types";

interface SubmissionResponseCardProps {
  response: ResponseData;
  index: number;
}

export default function SubmissionResponseCard({
  response,
  index,
}: SubmissionResponseCardProps) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="mb-3 sm:mb-4">
        <span className="bg-primary text-white text-xs sm:text-sm py-1 px-2 sm:px-3 rounded-full">
          Question {index + 1}
        </span>
      </div>

      <h3 className="text-base sm:text-lg font-medium mb-2">
        {response.questionText}
      </h3>

      {response.responseType === "file" ? (
        <div className="mt-2">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">File Upload</p>
          {response.fileUrl ? (
            <a
              href={response.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-DARK flex items-center gap-2 text-sm sm:text-base"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {response.fileName}
            </a>
          ) : (
            <p className="text-gray-500 text-sm sm:text-base">
              No file uploaded
            </p>
          )}
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">Text Response</p>
          <p className="bg-gray-50 p-3 sm:p-4 rounded-xl whitespace-pre-wrap text-sm sm:text-base">
            {response.textResponse}
          </p>
        </div>
      )}
    </div>
  );
}
