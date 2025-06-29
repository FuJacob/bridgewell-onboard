import React from "react";
import { useRouter } from "next/navigation";
import {
  FaClipboard,
  FaTrash,
  FaBuilding,
  FaUser,
  FaCalendar,
} from "react-icons/fa";

interface FormCardProps {
  form: {
    id: string;
    created_at: string;
    client_name: string;
    organization: string;
    login_key: string;
    questions: string;
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
    <div className="bg-white border border-gray-200 hover:border-primary transition-all duration-300 rounded-xl shadow-sm group hover:shadow-lg hover:scale-[1.01] overflow-hidden">
      <button
        className="group w-full p-4 sm:p-5 border-b border-gray-100 hover:border-primary group-hover:bg-primary group-hover:text-white transition-colors duration-200"
        onClick={handleFormClick}
      >
        <div className="flex justify-between w-full items-start">
          <div className="flex flex-col justify-center items-start gap-1">
            <h2 className="font-bold text-lg sm:text-xl text-primary group-hover:text-white flex items-center gap-2">
              <FaUser />
              {form.client_name}
            </h2>
            <h3 className="text-gray-600 group-hover:text-white text-sm sm:text-md flex items-center gap-2">
              <FaBuilding />
              {form.organization}
            </h3>
          </div>
          <p className="flex gap-2 items-center text-xs sm:text-sm text-gray-500 group-hover:text-white text-right">
            <FaCalendar />
            {new Date(form.created_at).toLocaleDateString()}
          </p>
        </div>
      </button>
      <div className="p-3 sm:p-4 bg-gray-50 group-hover:bg-gray-100 transition-colors duration-200">
        <div className="flex items-center justify-between">
          Login Key:{" "}
          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono  truncate transition-colors duration-200 group-hover:bg-gray-200">
            {form.login_key.slice(0, 4)}•••••
          </code>
          <div className="flex items-center gap-2">
            <button
              className="ml-2 text-primary hover:text-primary-dark p-1 flex items-center gap-1"
              onClick={(e) => handleCopyToClipboard(e, form.login_key)}
              title="Copy to clipboard"
            >
              <FaClipboard className="text-primary hover:text-primary-dark" />
              <span className="text-xs hidden sm:inline">Copy</span>
            </button>
            <button
              className="ml-2 p-1 flex items-center gap-1"
              onClick={handleDelete}
              title="Delete form"
            >
              <FaTrash className="text-red-500 hover:text-red-700" />
              <span className="text-xs hidden sm:inline text-red-600 group-hover:text-red-700">
                Delete
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
