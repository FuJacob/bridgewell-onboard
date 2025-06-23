import React from "react";
import { useRouter } from "next/navigation";
import { FaClipboard, FaTrash } from "react-icons/fa";

interface FormCardProps {
  form: {
    id: string;
    created_at: string;
    client_name: string;
    organization: string;
    login_key: string;
    questions: string;
  };
  onDelete: (loginKey: string, clientName: string) => void;
}

export default function FormCard({ form, onDelete }: FormCardProps) {
  const router = useRouter();

  const handleCopyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(form.login_key, form.client_name);
  };

  const handleFormClick = () => {
    router.push(`/client/form/${form.login_key}`);
  };

  return (
    <div className="bg-white border border-gray-200 hover:border-primary transition-colors duration-300 rounded-xl shadow-sm group hover:shadow-lg hover:scale-[1.01] transition-transform duration-200 overflow-hidden">
      <button
        className="group w-full p-4 sm:p-5 border-b border-gray-100 hover:border-primary group-hover:bg-primary group-hover:text-white transition-colors duration-200"
        onClick={handleFormClick}
      >
        <div className="flex flex-col justify-center items-start">
          <h2 className="font-bold text-lg sm:text-xl text-primary group-hover:text-white mb-1 truncate w-full text-left">
            {form.organization}
          </h2>
          <h3 className="text-gray-600 group-hover:text-white text-sm sm:text-md mb-2 truncate w-full text-left">
            {form.client_name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 group-hover:text-white text-left">
            Created: {new Date(form.created_at).toLocaleDateString()}
          </p>
        </div>
      </button>
      <div className="p-3 sm:p-4 bg-gray-50 group-hover:bg-gray-100 transition-colors duration-200">
        <div className="flex items-center">
          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono flex-1 overflow-hidden text-ellipsis transition-colors duration-200 group-hover:bg-gray-200">
            {form.login_key}
          </code>
          <button
            className="ml-2 text-primary hover:text-primary-dark p-1"
            onClick={(e) => handleCopyToClipboard(e, form.login_key)}
            title="Copy to clipboard"
          >
            <FaClipboard className="text-primary hover:text-primary-dark" />
          </button>
          <button
            className="ml-2 p-1"
            onClick={handleDelete}
            title="Delete form"
          >
            <FaTrash className="text-red-500 hover:text-red-700" />
          </button>
        </div>
      </div>
    </div>
  );
}
