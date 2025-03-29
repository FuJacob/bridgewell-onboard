"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const [loginKey, setLoginKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [completionStatus, setCompletionStatus] = useState<{ [key: string]: boolean }>({});
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const key = searchParams.get("key");
    if (key) {
      setLoginKey(key);
      handleSubmitWithKey(key);
    }
  }, [searchParams]);

  const handleSubmitWithKey = async (key: string) => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("login_key", key)
        .single();

      if (error) {
        setError("Invalid login key");
        return;
      }

      setClientData(data);
      const parsedQuestions = JSON.parse(data.questions);
      setQuestions(parsedQuestions);

      // Check completion status for all questions
      const status = await checkQuestionCompletion(
        data.client_id,
        data.client_name,
        parsedQuestions
      );
      setCompletionStatus(status);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load form data");
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
        clientData.client_id,
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
        <div className="flex items-center gap-6 mb-8">
          <div className="w-16 bg-gray-200 rounded-full px-2 py-1">
            <Link href="/">
              <Image
                src="/logo-bridgewell.png"
                alt="Bridgewell Financial Logo"
                width={60}
                height={60}
                layout="responsive"
                className="cursor-pointer"
              />
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-primary">Client Form</h1>
        </div>

        {!clientData ? (
          <div className="bg-white rounded-2xl p-8 shadow-lg">
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
                className="w-full bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition"
              >
                Access Form
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">
                Welcome, {clientData.client_name}
              </h2>
              <p className="text-gray-600">
                Organization: {clientData.organization}
              </p>
            </div>

            <div className="space-y-6">
              {questions.map((q, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-8 shadow-lg relative"
                >
                  {completionStatus[q.question] && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        Completed
                      </div>
                    </div>
                  )}
                  
                  <h3 className="text-xl font-semibold mb-2">{q.question}</h3>
                  {q.description && (
                    <p className="text-gray-600 mb-4">{q.description}</p>
                  )}
                  
                  {q.responseType === "file" && (
                    <div className="mt-4">
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(q.question, file, index);
                          }
                        }}
                        disabled={uploading[q.question]}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary file:text-white
                          hover:file:bg-primary-DARK"
                      />
                      {uploading[q.question] && (
                        <p className="mt-2 text-sm text-gray-500">
                          Uploading...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 