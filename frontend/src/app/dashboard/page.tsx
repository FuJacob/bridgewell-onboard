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
import {
  SuccessModal,
  SaveTemplateModal,
  DeleteConfirmationModal,
  LoadingOverlay,
} from "@/components/shared";
import TemplateSelectionModal from "@/components/forms/TemplateSelectionModal";
import { FormModal } from "@/components/forms";
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
  const [email, setEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    {
      question: "Please upload your master application package",
      description: "Based on the downloadable template",
      response_type: "file",
      due_date: "",
      templates: null,
    },
    {
      question: "Please upload proof of employee enrollment",
      description: "Must be in PDF format",
      response_type: "file",
      due_date: "",
      templates: null,
    },
    {
      question: "Void Cheque",
      description: "For direct deposit",
      response_type: "file",
      due_date: "",
      templates: null,
    },
    {
      question: "Termination Letter",
      description: "",
      response_type: "file",
      due_date: "",
      templates: null,
    },
    {
      question: "Digital Signature",
      description: "Please type your intials",
      response_type: "text",
      due_date: "",
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
  const [showFormDeleteConfirmation, setShowFormDeleteConfirmation] =
    useState(false);
  const [formToDelete, setFormToDelete] = useState<{
    loginKey: string;
    clientName: string;
    organization: string;
  } | null>(null);
  const [isDeletingForm, setIsDeletingForm] = useState(false);

  const filteredForms = forms.filter((form) =>
    form.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function deleteClient(
    loginKey: string,
    clientName: string,
    organization: string
  ) {
    setFormToDelete({ loginKey, clientName, organization });
    setShowFormDeleteConfirmation(true);
  }

  const confirmDeleteForm = async () => {
    if (!formToDelete) return;

    setIsDeletingForm(true);

    try {
      const result = await deleteClientService(
        formToDelete.loginKey,
        formToDelete.clientName
      );
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
        response_type: "text",
        due_date: "",
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
    newQuestions[index].response_type = value;
    setQuestions(newQuestions);
  };

  const updateDueDate = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].due_date = value;
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
    if (!clientName || !organization || !email) {
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
          q.response_type === "file" &&
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
        email,
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
    setEmail("");
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
      if (q.response_type === "file" && q.templates && q.templates.length > 0) {
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
      <FormModal
        isOpen={showFormModal}
        clientName={clientName}
        organization={organization}
        email={email}
        questions={questions}
        formError={formError}
        isGenerating={isGenerating}
        onClose={resetForm}
        onClientNameChange={setClientName}
        onOrganizationChange={setOrganization}
        onEmailChange={setEmail}
        onAddQuestion={addQuestion}
        onUpdateQuestion={updateQuestion}
        onUpdateDescription={updateDescription}
        onUpdateResponseType={updateResponseType}
        onUpdateDueDate={updateDueDate}
        onRemoveQuestion={removeQuestion}
        onMoveQuestionUp={moveQuestionUp}
        onMoveQuestionDown={moveQuestionDown}
        onTemplateUpload={(index, files) => {
          if (!files || files.length === 0) return;
          const newQuestions = [...questions];
          const templateFiles = Array.from(files).map((file) => ({
            fileName: file.name,
            fileId: "",
            uploadedAt: new Date().toISOString(),
            fileObject: file,
          }));
          newQuestions[index].templates = templateFiles;
          setQuestions(newQuestions);
        }}
        onSubmit={handleFormSubmit}
        onSaveAsTemplate={() => {
          console.log("Save as Template button clicked");
          console.log("Current showTemplateModal state:", showTemplateModal);
          setShowTemplateModal(true);
          console.log("Set showTemplateModal to true");
        }}
      />

      {/* Template Modal */}
      <SaveTemplateModal
        isOpen={showTemplateModal}
        templateName={templateName}
        templateStatus={templateStatus}
        isSavingTemplate={isSavingTemplate}
        onClose={() => setShowTemplateModal(false)}
        onTemplateNameChange={setTemplateName}
        onSave={handleSaveAsTemplate}
      />

      {/* Delete Template Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirmation}
        title="Delete Template"
        message="Are you sure you want to delete this template?"
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDeleteTemplate}
      />

      {/* Form Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showFormDeleteConfirmation}
        title="Delete Form"
        message={`Are you sure you want to delete the form for ${formToDelete?.clientName} from ${formToDelete?.organization}?`}
        warningMessage="This action cannot be undone."
        isDeleting={isDeletingForm}
        onClose={() => {
          setShowFormDeleteConfirmation(false);
          setFormToDelete(null);
        }}
        onConfirm={confirmDeleteForm}
      />

      {/* Form Deletion Loading Overlay */}
      <LoadingOverlay
        isOpen={isDeletingForm}
        title="Deleting Form"
        message={`Please wait while we delete the form for ${formToDelete?.clientName}...`}
      />
    </>
  );
}
