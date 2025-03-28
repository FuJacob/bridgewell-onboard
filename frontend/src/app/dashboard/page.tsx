"use client";

import React, { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";

type FormData = {
  id: string;
  client_name: string;
  organization: string;
  login_key: string;
  created_at: string;
  questions: string;
};

type FormSubmission = {
  id: string;
  client_id: string;
  client_name: string;
  login_key: string;
  responses: string;
  submitted_at: string;
};

export default function Dashboard() {
  const [forms, setForms] = useState<FormData[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "completed">(
    "all"
  );
  const [showFormModal, setShowFormModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [organization, setOrganization] = useState("");
  const [questions, setQuestions] = useState<
    {
      question: string;
      description: string;
      responseType: string;
      dueDate: string;
    }[]
  >([]);
  const [loginKey, setLoginKey] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Fetch forms
        const { data: formsData, error: formsError } = await supabase
          .from("clients")
          .select("*")
          .order("created_at", { ascending: false });

        if (formsError) {
          console.error("Error fetching forms:", formsError);
          setError("Failed to load forms data");
          setForms([]);
        } else {
          setForms(formsData || []);
        }

        // Fetch submissions
        const { data: submissionsData, error: submissionsError } =
          await supabase
            .from("submissions")
            .select("*")
            .order("submitted_at", { ascending: false });

        if (submissionsError) {
          console.error("Error fetching submissions:", submissionsError);
          setError("Failed to load submissions data");
          setSubmissions([]);
        } else {
          setSubmissions(submissionsData || []);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
        setForms([]);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFormStatus = (form: FormData) => {
    const formSubmissions = submissions.filter(
      (s) => s.login_key === form.login_key
    );
    if (formSubmissions.length === 0) return "pending";
    return "completed";
  };

  const filteredForms = forms.filter((form) => {
    if (activeTab === "all") return true;
    return getFormStatus(form) === activeTab;
  });

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

    if (!clientName.trim()) {
      setFormError("Client name is required");
      return;
    }

    if (!organization.trim()) {
      setFormError("Organization is required");
      return;
    }

    if (questions.length === 0) {
      setFormError("At least one question is required");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        setFormError(`Question ${i + 1} requires a question text`);
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
      setFormError("Failed to create form. Please try again.");
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

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-6">
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
            <div>
              <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
              {error && (
                <p className="text-red-500 text-sm mt-1">
                  {error} - Showing available data
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowFormModal(true)}
            className="bg-secondary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition"
          >
            Create New Form
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Total Forms
            </h3>
            <p className="text-4xl font-bold text-primary">{forms.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Pending Responses
            </h3>
            <p className="text-4xl font-bold text-secondary">
              {forms.filter((form) => getFormStatus(form) === "pending").length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Completed Forms
            </h3>
            <p className="text-4xl font-bold text-green-500">
              {
                forms.filter((form) => getFormStatus(form) === "completed")
                  .length
              }
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "all"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Forms
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "pending"
                ? "bg-secondary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "completed"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Forms List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {forms.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Organization
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Login Key
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredForms.map((form) => {
                    const status = getFormStatus(form);
                    const formSubmission = submissions.find(
                      (s) => s.login_key === form.login_key
                    );

                    return (
                      <tr key={form.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {form.client_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {form.organization}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-900">
                          {form.login_key}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(form.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {status === "completed" ? "Completed" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                // Copy login key to clipboard
                                navigator.clipboard.writeText(form.login_key);
                                alert("Login key copied to clipboard!");
                              }}
                              className="text-primary hover:text-primary-DARK"
                            >
                              Copy Key
                            </button>
                            {formSubmission && (
                              <Link
                                href={`/submissions/${form.login_key}`}
                                className="text-secondary hover:text-opacity-80"
                              >
                                View Response
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-16">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No forms available
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {error
                    ? "Could not retrieve forms data"
                    : "Get started by creating a new form for your clients"}
                </p>
                <div className="mt-6">
                  <Link
                    href="/admin"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-DARK focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Create New Form
                  </Link>
                </div>
              </div>
            )}
          </div>
          {filteredForms.length === 0 && forms.length > 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No forms match your current filter
              </p>
            </div>
          )}
        </div>

        {/* Form Creation Modal */}
        {showFormModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-primary">
                    Create New Form
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {loginKey ? (
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-primary mb-4">
                    Form Created Successfully!
                  </h3>
                  <p className="text-lg mb-2">Here is your client login key:</p>
                  <p className="text-3xl font-mono bg-gray-100 p-6 rounded-2xl mt-4 border-2 border-secondary">
                    {loginKey}
                  </p>
                  <button
                    onClick={resetForm}
                    className="mt-6 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition"
                  >
                    Create Another Form
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  {formError && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded mb-6">
                      <p>{formError}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                          No questions added yet. Click "Add Question" to get
                          started.
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
                              onChange={(e) =>
                                updateQuestion(index, e.target.value)
                              }
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
                                onChange={(e) =>
                                  updateDueDate(index, e.target.value)
                                }
                                className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {questions.length > 0 && (
                      <button
                        onClick={handleFormSubmit}
                        className="mt-6 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition w-full md:w-auto"
                      >
                        Generate Client Form
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
