"use client";

import React, { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { getAllForms } from "../login/actions";
import { type FormData, type Template, type Question } from "@/types/dashboard";
import {
  deleteClient as deleteClientService,
  createForm,
} from "@/services/admin";
import {
  saveTemplate,
  getTemplates,
  deleteTemplate as deleteTemplateService,
} from "@/services/templates";
import FormCard from "@/components/pages/FormCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SuccessModal from "@/components/shared/SuccessModal";
import TemplateSelectionModal from "@/components/forms/TemplateSelectionModal";
import { FaPlus, FaClipboardList, FaSearch } from "react-icons/fa";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [forms, setForms] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [organization, setOrganization] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    {
      question: "Please upload your master application package",
      description: "Based on the downloadable template",
      responseType: "file",
      dueDate: "",
      templates: null,
    },
    {
      question: "Please upload proof of employee enrollment",
      description: "Must be in PDF format",
      responseType: "file",
      dueDate: "",
      templates: null,
    },
    {
      question: "Void Cheque",
      description: "For direct deposit",
      responseType: "file",
      dueDate: "",
      templates: null,
    },
    {
      question: "Termination Letter",
      description: "",
      responseType: "file",
      dueDate: "",
      templates: null,
    },
    {
      question: "Digital Signature",
      description: "Please type your intials",
      responseType: "text",
      dueDate: "",
      templates: null,
    },
  ]);

  const [loginKey, setLoginKey] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateStatus, setTemplateStatus] = useState<string | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [showTemplateSelectionModal, setShowTemplateSelectionModal] =
    useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(
    null
  );
  const [showFormDeleteConfirmation, setShowFormDeleteConfirmation] = useState(false);
  const [formToDelete, setFormToDelete] = useState<{ loginKey: string; clientName: string; organization: string } | null>(null);
  const [isDeletingForm, setIsDeletingForm] = useState(false);

  const filteredForms = forms.filter((form) =>
    form.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function deleteClient(loginKey: string, clientName: string, organization: string) {
    setFormToDelete({ loginKey, clientName, organization });
    setShowFormDeleteConfirmation(true);
  }

  const confirmDeleteForm = async () => {
    if (!formToDelete) return;

    setIsDeletingForm(true);

    try {
      const result = await deleteClientService(formToDelete.loginKey, formToDelete.clientName);
      console.log("API delete result:", result);

      const supabase = await createClient();
      const { data: deletedForms, error } = await supabase
        .from("clients")
        .delete()
        .eq("login_key", formToDelete.loginKey)
        .select("*");
      console.log("Deleted from Supabase:", deletedForms);
      if (error) {
        console.error("Supabase deletion error:", error.message);
        return;
      }

      setForms((prevForms) =>
        prevForms.filter((form) => form.login_key !== formToDelete.loginKey)
      );

      console.log("Deleted from Supabase:", deletedForms);
    } catch (err) {
      console.error("Error deleting client:", err);
    } finally {
      setIsDeletingForm(false);
      setShowFormDeleteConfirmation(false);
      setFormToDelete(null);
    }
  };

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
      } catch {
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
        templates: null,
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
    if (!clientName || !organization) {
      setFormError("Please fill in all required fields");
      return;
    }

    if (questions.length === 0) {
      setFormError("Please add at least one question");
      return;
    }

    // Check if all questions have content
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        setFormError(`Question ${i + 1} is required`);
        return;
      }
    }

    setIsGenerating(true);
    setFormError(null);

    try {
      // Collect template files
      const templateFiles: { [key: string]: File } = {};
      const processedQuestions = questions.map((q, idx) => {
        if (
          q.responseType === "file" &&
          q.templates &&
          q.templates.length > 0
        ) {
          // Add all template files to FormData
          q.templates.forEach((template, templateIdx) => {
            if (template.fileObject instanceof File) {
              templateFiles[`templateFile_${idx}_${templateIdx}`] =
                template.fileObject;
            }
          });

          return {
            ...q,
            templates: q.templates.map((template) => ({
              fileName: template.fileObject?.name || template.fileName,
              fileId: template.fileId || "",
              uploadedAt: template.uploadedAt || new Date().toISOString(),
            })),
          };
        }
        return { ...q, templates: q.templates ? [...q.templates] : null };
      });

      const data = await createForm(
        clientName,
        organization,
        processedQuestions,
        templateFiles
      );

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
      setFormError(
        err instanceof Error ? err.message : "Failed to save form in Supabase"
      );
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
    setShowDeleteConfirmation(false);
    setTemplateToDelete(null);
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
    const processedQuestions = questions.map((q) => {
      if (q.responseType === "file" && q.templates && q.templates.length > 0) {
        // Remove fileObject but keep other template properties
        return {
          ...q,
          templates: q.templates.map((template) => ({
            fileName: template.fileObject?.name || template.fileName,
            fileId: template.fileId || "",
            uploadedAt: template.uploadedAt || new Date().toISOString(),
          })),
        };
      }
      return { ...q, templates: q.templates ? [...q.templates] : null };
    });

    console.log("processedQuestions to save:", processedQuestions);

    try {
      await saveTemplate(templateName, processedQuestions);
      setTemplateStatus("Template saved successfully!");
      setTemplateName("");
      setShowTemplateModal(false);
    } catch (err) {
      console.error("Error saving template:", err);
      setTemplateStatus(
        err instanceof Error ? err.message : "Failed to save template"
      );
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const templates = await getTemplates();
      setTemplates(templates);
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const loadTemplate = (template: Template) => {
    try {
      if (!template.questions || typeof template.questions !== "string") {
        console.error("Invalid template questions format");
        return;
      }
      const templateQuestions = JSON.parse(template.questions);
      if (!Array.isArray(templateQuestions)) {
        console.error("Template questions is not an array");
        return;
      }
      setQuestions(templateQuestions);
      setShowTemplateSelectionModal(false);
      setShowFormModal(true);
    } catch (_err) {
      console.error("Error parsing template questions:", _err);
    }
  };

  const handleCreateNewForm = () => {
    setShowTemplateSelectionModal(true);
    fetchTemplates();
  };

  const handleDeleteTemplate = (template: Template, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the template selection
    setTemplateToDelete(template);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      await deleteTemplateService(templateToDelete.id);
      // Remove the template from the local state
      setTemplates(templates.filter((t) => t.id !== templateToDelete.id));
      setShowDeleteConfirmation(false);
      setTemplateToDelete(null);
    } catch (err) {
      console.error("Error deleting template:", err);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (loginKey) {
    return (
      <SuccessModal isOpen={true} loginKey={loginKey} onClose={resetForm} />
    );
  }

  return (
    <>
      <main className="min-h-screen flex flex-col items-center justify-start pt-16 sm:pt-24 md:pt-32 lg:pt-40">
        <Link href="/" className="flex ">
          <Image
            src="/logo-bridgewell.png"
            alt="Bridgewell Financial Logo"
            width={200}
            height={200}
            className="object-contain"
          />
        </Link>
        <nav className="w-full max-w-7xl mx-auto flex items-center justify-between py-4 text-2xl sm:text-3xl font-bold text-primary">
          {/* Logo + Title */}
          <div className="flex flex-col space-y-1 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-semibold text-primary">
              Welcome, Bridgewell Admin
            </h1>
            <p className="text-sm text-gray-500">
              Create and manage client onboarding forms quickly and securely.
            </p>
          </div>
          {/* Error Message */}
          {error && (
            <p className="text-red-500 text-sm sm:text-base">
              {error} - Showing available data
            </p>
          )}
          {/* Action Button */}
          <button
            onClick={handleCreateNewForm}
            className="inline-flex items-center space-x-2 bg-secondary hover:bg-secondary/90 text-white text-sm font-medium px-4 py-2 rounded-full shadow-sm transition"
          >
            <FaPlus className="w-4 h-4" />
            <span>Create New Form</span>
          </button>
        </nav>

        {/* Stats Overview */}
        <section
          aria-labelledby="stats-heading"
          className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 md:mb-8 w-full"
        >
          <h2 id="stats-heading" className="sr-only">
            Dashboard Stats
          </h2>
          <article className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <FaClipboardList className="w-6 h-6 text-primary flex-shrink-0" />
            <div>
              <h3 className="text-sm sm:text-base font-medium text-gray-600">
                Total Forms
              </h3>
              <p className="text-xl sm:text-2xl font-bold text-primary">
                {forms.length}
              </p>
            </div>
          </article>
        </section>

        {/* Forms List */}
        <section
          aria-labelledby="forms-heading"
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors">
              <FaSearch className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search forms by organization"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ml-3 flex-1 bg-transparent text-sm sm:text-base text-gray-700 placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <h2 id="forms-heading" className="sr-only">
            Client Forms
          </h2>
          {filteredForms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {filteredForms.map((form) => (
                <FormCard key={form.id} form={form} onDelete={deleteClient} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              <p className="text-sm sm:text-base">No forms available</p>
            </div>
          )}
        </section>
      </main>

      <TemplateSelectionModal
        isOpen={showTemplateSelectionModal}
        templates={templates}
        isLoading={isLoadingTemplates}
        onClose={() => setShowTemplateSelectionModal(false)}
        onSelectBlank={() => {
          setQuestions([]);
          setShowTemplateSelectionModal(false);
          setShowFormModal(true);
        }}
        onSelectTemplate={loadTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />

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
                      No questions added yet. Click &quot;Add Question&quot; to
                      get started.
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
                          onChange={(e) =>
                            updateQuestion(index, e.target.value)
                          }
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
                            onChange={(e) =>
                              updateDueDate(index, e.target.value)
                            }
                            className="block w-full p-2 sm:p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-sm sm:text-base"
                          />
                        </div>
                      </div>

                      {q.responseType === "file" && (
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Template Documents (optional)
                          </label>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.png,.xls,.xlsx,.xlsm"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (!files || files.length === 0) return;

                              const newQuestions = [...questions];
                              const templateFiles = Array.from(files).map(
                                (file) => ({
                                  fileName: file.name,
                                  fileId: "",
                                  uploadedAt: new Date().toISOString(),
                                  fileObject: file,
                                })
                              );

                              newQuestions[index].templates = templateFiles;
                              setQuestions(newQuestions);
                            }}
                            className="block w-full p-2 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl"
                          />
                          {q.templates && q.templates.length > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              Uploaded:{" "}
                              {q.templates.map((t) => t.fileName).join(", ")}
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
                      console.log(
                        "Current showTemplateModal state:",
                        showTemplateModal
                      );
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-4 text-primary">
              Save as Template
            </h2>
            <input
              type="text"
              placeholder="Enter template name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl text-base mb-4"
            />
            {templateStatus && (
              <div
                className={`mb-4 text-sm ${
                  templateStatus.includes("success")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {templateStatus}
              </div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-4 text-primary">
              Delete Template
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this template?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-6 py-2 rounded-xl font-bold border-2 border-gray-300 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTemplate}
                className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Delete Confirmation Modal */}
      {showFormDeleteConfirmation && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-4 text-primary">
              Delete Form
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the form for{" "}
              <span className="font-semibold">{formToDelete?.clientName}</span> from{" "}
              <span className="font-semibold">{formToDelete?.organization}</span>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowFormDeleteConfirmation(false);
                  setFormToDelete(null);
                }}
                disabled={isDeletingForm}
                className="px-6 py-2 rounded-xl font-bold border-2 border-gray-300 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteForm}
                disabled={isDeletingForm}
                className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeletingForm ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Deletion Loading Overlay */}
      {isDeletingForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4"
          style={{ zIndex: 100000 }}
        >
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold mb-2 text-primary">
              Deleting Form
            </h2>
            <p className="text-gray-600">
              Please wait while we delete the form for{" "}
              <span className="font-semibold">{formToDelete?.clientName}</span>...
            </p>
          </div>
        </div>
      )}
    </>
  );
}
