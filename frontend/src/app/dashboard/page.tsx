"use client";

import React, { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { create } from "domain";
import { sign } from "crypto";
import { getAllForms } from "../login/actions";
import { useRouter } from "next/navigation";
type FormData = {
  id: string;
  created_at: string;
  client_name: string;
  organization: string;
  login_key: string;
  questions: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [organization, setOrganization] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<
    {
      question: string;
      description: string;
      responseType: string;
      dueDate: string;
    }[]
  >([
    {
      question: "Please upload the master application package",
      description: "As it appears on your government-issued ID",
      responseType: "text",
      dueDate: "",
    },
    {
      question: "Please upload a copy of your latest tax return",
      description: "Must be in PDF format",
      responseType: "file",
      dueDate: "",
    },
    {
      question: "What is your annual income?",
      description: "Include all sources of income",
      responseType: "text",
      dueDate: "",
    },
  ]);

  const [loginKey, setLoginKey] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function checkSignedIn() {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthed = !!user?.aud;

    if (!isAuthed) redirect("/");
  }
  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
    checkSignedIn();
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchData = async () => {
      try {
        const data = await getAllForms();
        console.log(await getAllForms());
        setForms(data as FormData[]);
      } catch (err) {
        setError("Failed to load dashboard data");
        setForms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mounted]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        description: "",
        responseType: "text",
        dueDate: "",
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].question = value;
    setQuestions(newQuestions);
  };

  const updateDescription = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].description = value;
    setQuestions(newQuestions);
  };

  const updateResponseType = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].responseType = value;
    setQuestions(newQuestions);
  };

  const updateDueDate = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].dueDate = value;
    setQuestions(newQuestions);
  };

  const moveQuestionUp = (index: number) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[index - 1];
    newQuestions[index - 1] = temp;
    setQuestions(newQuestions);
  };

  const moveQuestionDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[index + 1];
    newQuestions[index + 1] = temp;
    setQuestions(newQuestions);
  };

  const handleFormSubmit = async () => {
    setFormError(null);
    setIsGenerating(true);

    if (!clientName.trim()) {
      setFormError("Client name is required");
      setIsGenerating(false);
      return;
    }

    if (!organization.trim()) {
      setFormError("Organization is required");
      setIsGenerating(false);
      return;
    }

    if (questions.length === 0) {
      setFormError("At least one question is required");
      setIsGenerating(false);
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        setFormError(`Question ${i + 1} requires a question text`);
        setIsGenerating(false);
        return;
      }
    }

    const formData = {
      clientName,
      organization,
      questions,
    };

    try {
      const response = await fetch("/api/admin/create-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || "Failed to create form");
        setIsGenerating(false);
        return;
      }

      if (data.loginKey) {
        setLoginKey(data.loginKey);
        // Refresh the forms list
        const supabase = createClient();
        const { data: formsData } = await supabase
          .from("clients")
          .select("*")
          .order("created_at", { ascending: false });
        setForms(formsData || []);
      } else {
        setFormError(data.error || "An error occurred.");
      }
    } catch (err) {
      console.error("Error creating form:", err);
      setFormError("Failed to create form. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setClientName("");
    setOrganization("");
    setQuestions([]);
    setLoginKey(null);
    setFormError(null);
    setShowFormModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (loginKey) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-24 bg-gray-200 rounded-full px-4 py-2 mb-4 mx-auto">
            <Image
              src="/logo-bridgewell.png"
              alt="Bridgewell Financial Logo"
              width={80}
              height={80}
              layout="responsive"
            />
          </div>
          <h1 className="text-3xl font-bold mb-6 text-primary">
            Client Form Generated Successfully!
          </h1>
          <p className="text-lg mb-2">Here is your client login key:</p>
          <p className="text-3xl font-mono bg-gray-100 p-6 rounded-2xl mt-4 border-2 border-secondary">
            {loginKey}
          </p>
          <button
            onClick={resetForm}
            className="mt-8 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (showFormModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-4xl w-full overflow-y-auto h-5/6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-primary">
              Create New Client Form
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          {formError && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded mb-6">
              <p>{formError}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  placeholder="Enter client name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  placeholder="Enter organization name"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-primary">
                  Questions
                </h3>
                <button
                  onClick={addQuestion}
                  className="bg-secondary text-white px-4 py-2 rounded-xl font-medium"
                >
                  + Add Question
                </button>
              </div>
              {questions.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <p className="text-gray-500">
                    No questions added yet. Click "Add Question" to get started.
                  </p>
                </div>
              )}
              {questions.map((q, index) => (
                <div
                  key={index}
                  className="mb-6 p-6 border-2 border-gray-200 rounded-xl bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-primary text-white text-sm py-1 px-3 rounded-full">
                      Question {index + 1}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => moveQuestionUp(index)}
                        disabled={index === 0}
                        className={`p-2 rounded ${
                          index === 0
                            ? "text-gray-400"
                            : "text-primary hover:bg-gray-200"
                        }`}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveQuestionDown(index)}
                        disabled={index === questions.length - 1}
                        className={`p-2 rounded ${
                          index === questions.length - 1
                            ? "text-gray-400"
                            : "text-primary hover:bg-gray-200"
                        }`}
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeQuestion(index)}
                        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Question
                      </label>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => updateQuestion(index, e.target.value)}
                        placeholder="Enter your question"
                        className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Description (optional)
                      </label>
                      <input
                        type="text"
                        value={q.description}
                        onChange={(e) =>
                          updateDescription(index, e.target.value)
                        }
                        placeholder="Add a short description or hint for this question"
                        className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Response Type
                        </label>
                        <select
                          value={q.responseType}
                          onChange={(e) =>
                            updateResponseType(index, e.target.value)
                          }
                          className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl bg-white"
                        >
                          <option value="text">Text Response</option>
                          <option value="file">File Upload</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Due Date (optional)
                        </label>
                        <input
                          type="date"
                          value={q.dueDate}
                          onChange={(e) => updateDueDate(index, e.target.value)}
                          className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={resetForm}
                  className="px-6 py-3 rounded-xl font-bold border-2 border-gray-300 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFormSubmit}
                  disabled={isGenerating}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    "Generate Form"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-6">
            <div>
              <div className="flex items-center gap-5">
                <div className="w-456">
                  <Link href="/">
                    <Image
                      src="/logo-bridgewell.png"
                      alt="Bridgewell Financial Logo"
                      width={100}
                      height={100}
                      layout="responsive"
                      className="cursor-pointer"
                    />
                  </Link>
                </div>
                <h1 className="text-4xl font-bold text-primary">Dashboard</h1>
              </div>{" "}
              {error && (
                <p className="text-red-500 text-sm mt-1">
                  {error} - Showing available data
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowFormModal(true)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition"
          >
            Create New Form
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Total Forms
            </h3>
            <p className="text-4xl font-bold text-primary">{forms.length}</p>
          </div>
        </div>

        {/* Forms List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {forms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {forms.map((form: FormData, index: number) => (
                <div
                  key={index}
                  className="bg-white border-2 border-gray-200 hover:border-primary transition-colors duration-300 rounded-xl shadow-sm hover:shadow-md overflow-hidden"
                >
                  <button
                    className="group p-5 border-b border-gray-100 hover:border- hover:bg-primary w-full transition duration-300 ease-in-out "
                    onClick={() =>
                      router.push(
                        `http://localhost:3000/client/form/${form.login_key}`
                      )
                    }
                  >
                    <div className="flex flex-col items-center justify-center items-start ">
                      <h2 className="font-bold text-xl text-primary group-hover:text-white mb-1 truncate">
                        {form.organization}
                      </h2>
                      <h3 className="text-gray-600 group-hover:text-white text-md mb-2">
                        {form.client_name}
                      </h3>
                      <p className="text-sm text-gray-500 group-hover:text-white">
                        Created:{" "}
                        {new Date(form.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                  <div className="p-4 bg-gray-50">
                    <div className="flex items-center">
                      <span className="text-xs font-medium text-gray-500 mr-2">
                        Login Key:
                      </span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono flex-1 overflow-hidden text-ellipsis">
                        {form.login_key}
                      </code>
                      <button
                        className="ml-2 text-primary hover:text-primary-DARK"
                        onClick={() =>
                          navigator.clipboard.writeText(form.login_key)
                        }
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>No forms available</div>
          )}
        </div>
      </div>
    </div>
  );
}
