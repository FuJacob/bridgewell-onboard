"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client";
import {
  checkQuestionCompletion,
  uploadFileToClientFolder,
} from "@/app/utils/microsoft/graph";
import Link from "next/link";
import Image from "next/image";

interface Question {
  question: string;
  description: string;
  responseType: string;
  dueDate: string;
}

interface ClientData {
  client_name: string;
  organization: string;
  questions: string;
  client_id: string;
}

export default function ClientForm() {
  return (
    <Suspense fallback={<ClientFormLoading />}>
      <ClientFormContent />
    </Suspense>
  );
}

// Separate component that uses useSearchParams
function ClientFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loginKey, setLoginKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [completionStatus, setCompletionStatus] = useState<{
    [key: string]: boolean;
  }>({});
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Check for login key in localStorage
    const storedKey = localStorage.getItem("clientLoginKey");
    if (storedKey) {
      // If we already have a login key, redirect to the form page
      router.push(`/client/form/${storedKey}`);
      return;
    }

    // Check for login key in URL
    const key = searchParams.get("key");
    if (key) {
      setLoginKey(key);
      handleSubmitWithKey(key);
    }
  }, [searchParams, router]);

  const handleSubmitWithKey = async (key: string) => {
    try {
      setLoading(true);
      setError(null);

      // Validate the login key with our API
      const response = await fetch(
        `/api/client/validate-key?key=${encodeURIComponent(key)}`
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Invalid login key");
        return;
      }

      // Store in localStorage for persistence
      localStorage.setItem("clientLoginKey", key);

      // Redirect to the form page
      router.push(`/client/form/${key}`);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to validate login key");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginKey) {
      setError("Please enter a login key");
      return;
    }
    await handleSubmitWithKey(loginKey);
  };

  const handleFileUpload = async (
    question: string,
    file: File,
    index: number
  ) => {
    if (!clientData) return;

    try {
      setUploading((prev) => ({ ...prev, [question]: true }));
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${timestamp}_${file.name}`;

      const buffer = await file.arrayBuffer();
      await uploadFileToClientFolder(
        loginKey,
        clientData.client_name,
        `${question
          .replace(/[^a-zA-Z0-9]/g, "_")
          .substring(0, 50)}/${fileName}`,
        new Blob([buffer])
      );

      // Update completion status
      setCompletionStatus((prev) => ({ ...prev, [question]: true }));
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Failed to upload file");
    } finally {
      setUploading((prev) => ({ ...prev, [question]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-6 md:mb-8">
          <div className="w-16 sm:w-20 md:w-24 bg-gray-200 rounded-full px-2 sm:px-3 md:px-4 py-1 md:py-2">
            <Link href="/">
              <Image
                src="/logo-bridgewell.png"
                alt="Bridgewell Financial Logo"
                width={80}
                height={80}
                layout="responsive"
                className="cursor-pointer"
              />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg max-w-full sm:max-w-md mx-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-4 md:mb-6 text-center">
            Client Portal
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Login Key
              </label>
              <input
                type="text"
                value={loginKey}
                onChange={(e) => setLoginKey(e.target.value)}
                placeholder="Enter your login key"
                className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
                required
              />
            </div>

            {error && (
              <div className="p-3 md:p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm sm:text-base">
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-primary text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:bg-primary-DARK transition text-sm sm:text-base
                ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Accessing...
                </span>
              ) : (
                "Access Form"
              )}
            </button>
          </form>

          <div className="mt-4 md:mt-6 text-center">
            <Link href="/" className="text-primary hover:underline text-sm sm:text-base">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function ClientFormLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="w-32 sm:w-40 md:w-48 animate-pulse bg-white/20 rounded-lg h-12"></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg max-w-full sm:max-w-md mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
