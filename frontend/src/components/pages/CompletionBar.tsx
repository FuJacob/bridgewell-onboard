import React from "react";

interface CompletionBarProps {
  completedCount: number;
  totalCount: number;
}

export default function CompletionBar({
  completedCount,
  totalCount,
}: CompletionBarProps) {
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getCompletionStatus = () => {
    if (percentage === 100) return "Form Complete!";
    if (percentage === 0) return "Form Not Started";
    return `${percentage}% of Pre-Implementation Checklist Complete`;
  };

  return (
    <div className="mb-4 md:mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
        <h2 className="text-base sm:text-lg font-medium">
          {getCompletionStatus()}
        </h2>
        <span className="text-xs sm:text-sm text-gray-500">
          {completedCount} of {totalCount} completed
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
