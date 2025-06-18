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
      template?: {
        fileName: string;
        fileId: string;
        uploadedAt: string;
      } | null;
    }[]
  >([
    {
      question: "Please upload your master application package",
      description: "Based on the downloadable template",
      responseType: "file",
      dueDate: "",
      template: null,
    },
    {
      question: "Please upload proof of employee enrollment",
      description: "Must be in PDF format",
      responseType: "file",
      dueDate: "",
      template: null,
    },
    {
      question: "Void Cheque",
      description: "For direct deposit",
      responseType: "file",
      dueDate: "",
      template: null,
    },
    {
      question: "Termination Letter",
      description: "",
      responseType: "file",
      dueDate: "",
      template: null,
    },
    {
      question: "Digital Signature",
      description: "Please type your intials",
      responseType: "text",
      dueDate: "",
      template: null,
    },
  ]);

  const [loginKey, setLoginKey] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [tempLoginKey, setTempLoginKey] = useState<string>(
    () => "temp-" + Math.random().toString(36).substring(2, 15)
  );

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateStatus, setTemplateStatus] = useState<string | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [showTemplateSelectionModal, setShowTemplateSelectionModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

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
        template: null,
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

    // Gather all form data and template files into a single FormData object
    const formData = new FormData();
    formData.append("clientName", clientName);
    formData.append("organization", organization);
    formData.append(
      "questions",
      JSON.stringify(
        questions.map((q, idx) => {
          if (
            q.responseType === "file" &&
            q.template &&
            (q.template as any).fileObject instanceof File
          ) {
            // We'll upload the file as part of the FormData
            formData.append(
              `templateFile_${idx}`,
              (q.template as any).fileObject
            );
            return {
              ...q,
              template: {
                ...q.template,
                fileName: (q.template as any).fileObject.name,
              },
            };
          }
          return { ...q, template: q.template ? { ...q.template } : null };
        })
      )
    );

    try {
      const response = await fetch("/api/admin/create-form", {
        method: "POST",
        body: formData,
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
      setFormError("Failed to save form in Supabase");
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
    setShowTemplateSelectionModal(false);
  };

  const handleSaveAsTemplate = async () => {
    setTemplateStatus(null);
    console.log("handleSaveAsTemplate called");
    console.log("templateName:", templateName);
    console.log("questions:", questions);
    
    if (!templateName.trim()) {
      setTemplateStatus("Template name is required");
      return;
    }
    if (questions.length === 0) {
      setTemplateStatus("At least one question is required");
      return;
    }
    
    setIsSavingTemplate(true);
    
    // Process questions the same way as create-form API does
    const processedQuestions = questions.map((q, idx) => {
      if (
        q.responseType === "file" &&
        q.template &&
        (q.template as any).fileObject instanceof File
      ) {
        // Remove fileObject but keep other template properties
        return {
          ...q,
          template: {
            fileName: (q.template as any).fileObject.name,
            fileId: q.template.fileId || "",
            uploadedAt: q.template.uploadedAt || new Date().toISOString(),
          },
        };
      }
      return { ...q, template: q.template ? { ...q.template } : null };
    });
    
    console.log("processedQuestions to save:", processedQuestions);
    
    try {
      const response = await fetch("/api/admin/save-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateName, questions: processedQuestions }),
      });
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
      
      if (!response.ok) {
        setTemplateStatus(data.error || "Failed to save template");
      } else {
        setTemplateStatus("Template saved successfully!");
        setTemplateName("");
        setShowTemplateModal(false);
      }
    } catch (err) {
      console.error("Error saving template:", err);
      setTemplateStatus("Failed to save template");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await fetch("/api/admin/get-templates");
      const data = await response.json();
      if (response.ok) {
        setTemplates(data.templates || []);
      } else {
        console.error("Failed to fetch templates:", data.error);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const loadTemplate = (template: any) => {
    try {
      const templateQuestions = JSON.parse(template.questions);
      setQuestions(templateQuestions);
      setShowTemplateSelectionModal(false);
      setShowFormModal(true);
    } catch (err) {
      console.error("Error parsing template questions:", err);
    }
  };

  const handleCreateNewForm = () => {
    setShowTemplateSelectionModal(true);
    fetchTemplates();
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
          <div className="flex items-center justify-center gap-2">
            <p className="text-3xl font-mono bg-gray-100 p-6 rounded-2xl mt-4 border-2 border-secondary">
              {loginKey}
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(loginKey)}
              className="ml-2 bg-secondary text-white px-4 py-2 rounded-xl font-bold hover:bg-secondary-DARK transition"
              title="Copy to clipboard"
            >
              📋 Copy Code
            </button>
          </div>
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

  return (
    <>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-4 sm:gap-6">
              <div>
                <div className="flex items-center gap-3 sm:gap-5">
                  <div className="w-16 sm:w-20 md:w-24">
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
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">Dashboard</h1>
                </div>{" "}
                {error && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {error} - Showing available data
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleCreateNewForm}
              className="w-full sm:w-auto bg-primary text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:bg-primary-DARK transition text-sm sm:text-base"
            >
              Create New Form
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 md:mb-8">
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-base sm:text-lg font-medium text-gray-600 mb-2">
                Total Forms
              </h3>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">{forms.length}</p>
            </div>
          </div>

          {/* Forms List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {forms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 p-4 sm:p-6">
                {forms.map((form: FormData, index: number) => (
                  <div
                    key={index}
                    className="bg-white border-2 border-gray-200 hover:border-primary transition-colors duration-300 rounded-xl shadow-sm hover:shadow-md overflow-hidden"
                  >
                    <button
                      className="group p-4 sm:p-5 border-b border-gray-100 hover:border- hover:bg-primary w-full transition duration-300 ease-in-out "
                      onClick={() =>
                        router.push(
                          `/client/form/${form.login_key}`
                        )
                      }
                    >
                      <div className="flex flex-col justify-center items-start ">
                        <h2 className="font-bold text-lg sm:text-xl text-primary group-hover:text-white mb-1 truncate w-full text-left">
                          {form.organization}
                        </h2>
                        <h3 className="text-gray-600 group-hover:text-white text-sm sm:text-md mb-2 truncate w-full text-left">
                          {form.client_name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 group-hover:text-white text-left">
                          Created:{" "}
                          {new Date(form.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                    <div className="p-3 sm:p-4 bg-gray-50">
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-500 mr-2 flex-shrink-0">
                          Login Key:
                        </span>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono flex-1 overflow-hidden text-ellipsis">
                          {form.login_key}
                        </code>
                        <button
                          className="ml-2 text-primary hover:text-primary-DARK flex-shrink-0 p-1"
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
              <div className="text-center py-8 sm:py-12 text-gray-500">
                <p className="text-sm sm:text-base">No forms available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Selection Modal */}
      {showTemplateSelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full text-center">
            <h2 className="text-2xl font-bold mb-6 text-primary">Select Template</h2>
            <p className="text-gray-600 mb-6">Choose a template to start with or create a blank form</p>
            
            {isLoadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3">Loading templates...</span>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Blank Template Option */}
                <button
                  onClick={() => {
                    setQuestions([]);
                    setShowTemplateSelectionModal(false);
                    setShowFormModal(true);
                  }}
                  className="w-full p-4 border-2 border-gray-200 hover:border-primary rounded-xl text-left transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-primary">Blank Form</h3>
                      <p className="text-gray-600 text-sm">Start with an empty form and add your own questions</p>
                    </div>
                    <span className="text-gray-400">→</span>
                  </div>
                </button>

                {/* Saved Templates */}
                {templates.map((template, index) => (
                  <button
                    key={template.id}
                    onClick={() => loadTemplate(template)}
                    className="w-full p-4 border-2 border-gray-200 hover:border-primary rounded-xl text-left transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-primary">{template.template_name}</h3>
                        <p className="text-gray-600 text-sm">
                          {JSON.parse(template.questions).length} questions • Created {new Date(template.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-gray-400">→</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => setShowTemplateSelectionModal(false)}
                className="px-6 py-3 rounded-xl font-bold border-2 border-gray-300 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 max-w-4xl w-full overflow-y-auto max-h-[95vh] sm:h-5/6">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary">
                Create New Client Form
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl p-1"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded mb-4 sm:mb-6 text-sm sm:text-base">
                <p>{formError}</p>
              </div>
            )}

            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter client name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    placeholder="Enter organization name"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-primary">
                    Questions
                  </h3>
                  <button
                    onClick={addQuestion}
                    className="w-full sm:w-auto bg-secondary text-white px-3 sm:px-4 py-2 rounded-xl font-medium text-sm sm:text-base"
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
                    className="mb-4 sm:mb-6 p-4 sm:p-6 border-2 border-gray-200 rounded-xl bg-gray-50"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0 mb-4">
                      <span className="bg-primary text-white text-xs sm:text-sm py-1 px-2 sm:px-3 rounded-full">
                        Question {index + 1}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => moveQuestionUp(index)}
                          disabled={index === 0}
                          className={`p-1 sm:p-2 rounded text-sm sm:text-base ${
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
                          className={`p-1 sm:p-2 rounded text-sm sm:text-base ${
                            index === questions.length - 1
                              ? "text-gray-400"
                              : "text-primary hover:bg-gray-200"
                          }`}
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeQuestion(index)}
                          className="bg-red-500 text-white p-1 sm:p-2 rounded-lg hover:bg-red-600 text-sm sm:text-base"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1">
                          Question
                        </label>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => updateQuestion(index, e.target.value)}
                          placeholder="Enter your question"
                          className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1">
                          Description (optional)
                        </label>
                        <input
                          type="text"
                          value={q.description}
                          onChange={(e) =>
                            updateDescription(index, e.target.value)
                          }
                          placeholder="Add a short description or hint for this question"
                          className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium mb-1">
                            Response Type
                          </label>
                          <select
                            value={q.responseType}
                            onChange={(e) =>
                              updateResponseType(index, e.target.value)
                            }
                            className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl bg-white text-sm sm:text-base"
                          >
                            <option value="text">Text Response</option>
                            <option value="file">File Upload</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs sm:text-sm font-medium mb-1">
                            Due Date (optional)
                          </label>
                          <input
                            type="date"
                            value={q.dueDate}
                            onChange={(e) => updateDueDate(index, e.target.value)}
                            className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
                          />
                        </div>
                      </div>

                      {q.responseType === "file" && (
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Template Document (optional)
                          </label>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const newQuestions = [...questions];
                              newQuestions[index].template = {
                                fileName: file.name,
                                fileId: "",
                                uploadedAt: new Date().toISOString(),
                                fileObject: file, // store the File object for later upload (not for backend)
                              } as any; // type assertion to allow fileObject in state only
                              setQuestions(newQuestions);
                            }}
                            className="block w-full p-2 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl"
                          />
                          {q.template && q.template.fileName && (
                            <div className="text-xs text-gray-600 mt-1">
                              Uploaded: {q.template.fileName}
                            </div>
                          )}
                        </div>
                      )}
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
                    onClick={() => {
                      console.log("Save as Template button clicked");
                      console.log("Current showTemplateModal state:", showTemplateModal);
                      setShowTemplateModal(true);
                      console.log("Set showTemplateModal to true");
                    }}
                    disabled={isGenerating}
                    className="bg-secondary text-white px-6 py-3 rounded-xl font-bold hover:bg-secondary-DARK transition flex items-center gap-2"
                    title="Save these questions as a template"
                  >
                    Save as Template
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
      )}

      {/* Template Modal - HIGHEST Z-INDEX */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-4 text-primary">Save as Template</h2>
            <input
              type="text"
              placeholder="Enter template name"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-base mb-4"
            />
            {templateStatus && (
              <div className={`mb-4 text-sm ${templateStatus.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{templateStatus}</div>
            )}
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-6 py-2 rounded-xl font-bold border-2 border-gray-300 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsTemplate}
                disabled={isSavingTemplate}
                className="bg-secondary text-white px-6 py-2 rounded-xl font-bold hover:bg-secondary-DARK transition flex items-center gap-2"
              >
                {isSavingTemplate ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Save Template"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
