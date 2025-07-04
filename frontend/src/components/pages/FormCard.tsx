import React from "react";
import { useRouter } from "next/navigation";
import {
  FaClipboard,
  FaTrash,
  FaBuilding,
  FaUser,
  FaCalendar,
  FaEnvelope,
} from "react-icons/fa";

interface FormCardProps {
  form: {
    id: string;
    created_at: string;
    client_name: string;
    organization: string;
    login_key: string;
    questions: string;
    description: string;
  };
  onDelete: (
    loginKey: string,
    clientName: string,
    organization: string
  ) => void;
}

export default function FormCard({ form, onDelete }: FormCardProps) {
  const router = useRouter();

  const handleCopyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(form.login_key, form.client_name, form.organization);
  };

  const handleFormClick = () => {
    router.push(`/client/form/${form.login_key}`);
  };

  return (
    <div className="bg-white border border-gray-200 hover:border-primary transition-all duration-300 rounded-xl shadow-sm group hover:shadow-lg hover:scale-[1.01] overflow-hidden flex flex-col justify-between">
      <button
        className="flex-1 group w-full p-4 sm:p-5 border-b border-gray-100 hover:border-primary group-hover:bg-primary group-hover:text-white transition-colors duration-200 flex flex-col justify-start items-stretch"
        onClick={handleFormClick}
      >
        <div className="flex justify-between w-full items-start">
          <div className="flex flex-col items-start gap-2">
            <h2 className="font-semibold text-base sm:text-lg text-primary group-hover:text-white flex items-center gap-2">
              <FaUser />
              {form.client_name}
            </h2>
            <h3 className="text-gray-600 group-hover:text-white text-sm sm:text-sm flex items-center gap-2">
              <FaBuilding />
              {form.organization}
            </h3>
          </div>
          <div className="flex flex-col items-end mt-2 gap-2">
            <p className="flex gap-2 items-center text-xs sm:text-sm text-gray-500 group-hover:text-white text-right">
              <FaCalendar />
              {new Date(form.created_at).toLocaleDateString()}
            </p>
            <p className="flex gap-2 items-center text-xs sm:text-sm text-gray-500 group-hover:text-white text-right">
              <FaEnvelope />
              {form.email}
            </p>
          </div>
        </div>

        <div className="flex items-start text-left gap-2 mt-3 text-xs text-gray-700 group-hover:text-white transition-colors duration-200">
          <p className="overflow-y-auto max-h-24 ">
            {form.description ?? (
              <span className="italic">No description provided</span>
            )}
          </p>
        </div>
      </button>
      <div className="p-3 sm:p-4 bg-gray-50 group-hover:bg-gray-100 transition-colors duration-200">
        <div className="flex items-center justify-between">
          Login Key:{" "}
          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono truncate transition-colors duration-200 group-hover:bg-gray-200">
            {form.login_key.slice(0, 4)}•••••
          </code>
          <div className="flex items-center gap-2">
            <button
              className="ml-2 text-primary hover:text-primary-dark p-1 flex items-center gap-1"
              onClick={(e) => handleCopyToClipboard(e, form.login_key)}
              title="Copy to clipboard"
            >
              <FaClipboard className="text-primary hover:text-primary-dark" />
              <span className="text-sm hidden sm:inline">Copy</span>
            </button>
            <button
              className="ml-2 p-1 flex items-center gap-1"
              onClick={handleDelete}
              title="Delete form"
            >
              <FaTrash className="text-red-500 hover:text-red-700" />
              <span className="text-sm hidden sm:inline text-red-600 group-hover:text-red-700">
                Delete
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
