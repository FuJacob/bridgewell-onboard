"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client";
import { checkQuestionCompletion, uploadFileToClientFolder } from "@/app/utils/microsoft/graph";
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
  // const [signedIn, setSignedIn] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loginKey, setLoginKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [completionStatus, setCompletionStatus] = useState<{ [key: string]: boolean }>({});
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
      const response = await fetch(`/api/client/validate-key?key=${encodeURIComponent(key)}`);
      
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
      setUploading(prev => ({ ...prev, [question]: true }));
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${timestamp}_${file.name}`;
      
      const buffer = await file.arrayBuffer();
      await uploadFileToClientFolder(
        loginKey,
        clientData.client_name,
        `${question.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}/${fileName}`,
        new Blob([buffer])
      );

      // Update completion status
      setCompletionStatus(prev => ({ ...prev, [question]: true }));
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Failed to upload file");
    } finally {
      setUploading(prev => ({ ...prev, [question]: false }));
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
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          <div className="w-24 bg-gray-200 rounded-full px-4 py-2">
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

        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-6 text-center">Client Portal</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Login Key
              </label>
              <input
                type="text"
                value={loginKey}
                onChange={(e) => setLoginKey(e.target.value)}
                placeholder="Enter your login key"
                className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition
                ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Accessing...
                </span>
              ) : (
                "Access Form"
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-primary hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 