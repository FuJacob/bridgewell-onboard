"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/app/utils/supabase/client";
import { getClientFolderWebUrl } from "@/app/utils/microsoft/graph";
import { AppQuestion, Question, QuestionTemplate } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  getClientFormData,
  getClientSubmissions,
  submitQuestionResponse,
} from "@/services/client";
import { ClientData } from "@/types";
import { redoQuestion } from "@/services/admin";
import { updateForm } from "@/services/admin";

import CompletionBar from "@/components/pages/CompletionBar";
import QuestionCard from "@/components/pages/QuestionCard";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { FaSignInAlt, FaEdit, FaTimes } from "react-icons/fa";

// Helper function to convert database questions to app questions
const convertToAppQuestions = (dbQuestions: Question[]): AppQuestion[] => {
  return dbQuestions.map((q) => ({
    ...q,
    templates:
      q.templates && typeof q.templates === "string"
        ? (() => {
            try {
              const parsed = JSON.parse(q.templates as string) as unknown;
              return Array.isArray(parsed)
                ? (parsed as QuestionTemplate[])
                : null;
            } catch {
              return null;
            }
          })()
        : Array.isArray(q.templates)
        ? (q.templates as unknown as QuestionTemplate[])
        : null,
  }));
};

// Helper function to convert app questions back to database format
const convertToDbQuestions = (appQuestions: AppQuestion[]): Question[] => {
  return appQuestions.map((q) => ({
    ...q,
    templates: q.templates ? JSON.stringify(q.templates) : null,
  })) as Question[];
};

export default function ClientFormPage() {
  const [signedIn, setSignedIn] = useState(false);
  const params = useParams();
  const router = useRouter();
  // Get the login key from the URL
  const loginKey = params.key as string;

  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [questions, setQuestions] = useState<AppQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingCompletion, setCheckingCompletion] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<{
    [index: number]: string | null;
  }>({});
  const [files, setFiles] = useState<{ [index: number]: File[] | null }>({});
  const [submittingQuestions, setSubmittingQuestions] = useState<{
    [index: number]: boolean;
  }>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<{
    [index: number]: boolean;
  }>({});
  const [questionErrors, setQuestionErrors] = useState<{
    [index: number]: string | null;
  }>({});
  const [submittedFiles, setSubmittedFiles] = useState<{
    [index: number]: { name: string; type: string; fileId?: string };
  }>({});
  // immediate clear handled via API, no deferred flags needed

  // Admin edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdatingForm, setIsUpdatingForm] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editUploadNotice, setEditUploadNotice] = useState<string | null>(null);
  const [clearingTemplates, setClearingTemplates] = useState<{ [index: number]: boolean }>({});
  const beforeUnloadRef = useRef<((e: BeforeUnloadEvent) => void) | null>(null);
  const [pendingTemplateUploads, setPendingTemplateUploads] = useState(0); // reserved for future use
  const pendingUploadsRef = useRef(0);
  useEffect(() => { pendingUploadsRef.current = pendingTemplateUploads; }, [pendingTemplateUploads]);
  // Admin edit: client info fields
  const [editClientName, setEditClientName] = useState("");
  const [editOrganization, setEditOrganization] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editClientDescription, setEditClientDescription] = useState("");

  // Check if questions are already completed
  const checkCompletionStatus = useCallback(async () => {
    try {
      setCheckingCompletion(true);
      const submissionData = await getClientSubmissions(loginKey);

      if (submissionData && submissionData.responses) {
        const completedQuestions: { [index: number]: boolean } = {};

        Object.keys(submissionData.responses).forEach((index) => {
          const questionIndex = parseInt(index);
          completedQuestions[questionIndex] = true;
        });

        setSubmittedQuestions(completedQuestions);
      }
    } catch (err) {
      console.error("Error checking completion status:", err);
    }
    finally {
      setCheckingCompletion(false);
    }
  }, [loginKey]);
  const checkSignedIn = useCallback(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthed = !!user?.aud;
    setSignedIn(isAuthed);
    if (!isAuthed) {
      try {
        const response = await fetch("/api/client/update-last-active-at", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loginKey }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error updating last active time:", errorData);
        } else {
          console.log("Updated last active time via API");
        }
      } catch (error) {
        console.error("Error updating last active time:", error);
      }
    }
  }, [loginKey]);

  // Fetch client data and form questions
  useEffect(() => {
    async function fetchClientData(): Promise<void> {
      if (!loginKey) {
        router.push("/");
        return;
      }

      try {
        // Store login key in localStorage for persistence
        localStorage.setItem("clientLoginKey", loginKey);

        const clientData = await getClientFormData(loginKey);
        setClientData(clientData);
        const convertedQuestions = convertToAppQuestions(clientData.questions);
        const getOrder = (q: any) => {
          const o = q?.order;
          if (typeof o === 'number') return o;
          if (typeof o === 'string') {
            const n = parseInt(o, 10);
            return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
          }
          return Number.MAX_SAFE_INTEGER;
        };
        setQuestions(
          convertedQuestions.sort((a, b) => {
            const ao = getOrder(a);
            const bo = getOrder(b);
            if (ao !== bo) return ao - bo;
            return (a.id ?? 0) - (b.id ?? 0);
          })
        );

        // Initialize responses and status objects
        const initialResponses: { [index: number]: string | null } = {};
        const initialSubmitting: { [index: number]: boolean } = {};
        const initialSubmitted: { [index: number]: boolean } = {};
        const initialErrors: { [index: number]: string | null } = {};

        convertedQuestions.forEach((q: AppQuestion, index: number) => {
          initialResponses[index] = "";
          initialSubmitting[index] = false;
          initialSubmitted[index] = false;
          initialErrors[index] = null;
        });

        setResponses(initialResponses);
        setSubmittingQuestions(initialSubmitting);
        setSubmittedQuestions(initialSubmitted);
        setQuestionErrors(initialErrors);

        // Check completion status for questions
        checkCompletionStatus();
      } catch (err) {
        console.error("Error fetching form data:", err);
        setError(
          "Failed to load form. Please check your login key and try again."
        );
        localStorage.removeItem("clientLoginKey");
      } finally {
        setLoading(false);
      }
    }

    fetchClientData();
  }, [loginKey, router, checkCompletionStatus]);

  // Handle client-side mounting
  useEffect(() => {
    checkSignedIn();
  }, [checkSignedIn]);

  const handleTextChange = (index: number, value: string) => {
    setResponses({ ...responses, [index]: value });

    // Clear error when typing
    if (questionErrors[index]) {
      setQuestionErrors({ ...questionErrors, [index]: null });
    }
  };

  const handleFileChange = (index: number, newFiles: File[] | null) => {
    setFiles({ ...files, [index]: newFiles });

    // Clear error when selecting a file
    if (questionErrors[index]) {
      setQuestionErrors({ ...questionErrors, [index]: null });
    }
  };

  // Add template files while editing an existing form (admin modal)
  const handleTemplateUploadInEdit = (index: number, fileList: FileList) => {
    const incomingFiles = Array.from(fileList);
    setQuestions((prev) => {
      const newQuestions = [...prev];
      const q = newQuestions[index];
      const existingTemplates = Array.isArray(q.templates) ? [...q.templates] : [];
      const nowIso = new Date().toISOString();
      incomingFiles.forEach((file) => {
        existingTemplates.push({
          fileName: file.name,
          fileId: "",
          uploadedAt: nowIso,
          // client-side only handle; server reads FormData and uploads
          fileObject: file,
        } as unknown as QuestionTemplate);
      });
      newQuestions[index] = { ...q, templates: existingTemplates };
      return newQuestions;
    });
  };

  const handleClearTemplatesInEdit = async (index: number) => {
    const q = questions[index];
    if (q.response_type !== "file" && q.response_type !== "notice") return;
    // Optionally fetch count first by listing current templates state (best-effort via state)
    const count = Array.isArray(q.templates) ? q.templates.length : 0;
    const confirmed = window.confirm(
      count > 0
        ? `Remove existing ${count} template${count === 1 ? '' : 's'} for this question? This only clears the template folder (answers remain).`
        : `Clear template folder for this question? This only clears the template folder (answers remain).`
    );
    if (!confirmed) return;

    try {
      setClearingTemplates((prev) => ({ ...prev, [index]: true }));
      const resp = await fetch('/api/admin/clear-template-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginKey, question: q.question || '' }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Failed to clear template folder');
      }
      // Update UI to reflect cleared templates
      setQuestions((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], templates: [] };
        return next;
      });
      alert('Template folder cleared. You can add new templates now.');
    } catch (e) {
      console.error(e);
      alert('Failed to clear template folder.');
    } finally {
      setClearingTemplates((prev) => ({ ...prev, [index]: false }));
    }
  };

  const deleteClientUploads = async (
    loginKey: string,
    name: string,
    question: string,
    index: number
  ) => {
    try {
      const data = await redoQuestion(loginKey, name, question);
      console.log("DELETE CLIENT UPLOADS", data);
      if (data.success) {
        setSubmittedQuestions({
          ...submittedQuestions,
          [index]: false,
        });
      } else {
        console.log("Error deleting client uploads");
      }
    } catch (err) {
      console.error("Error deleting client uploads:", err);
    }
  };

  const handleSubmitQuestion = async (index: number, question: AppQuestion) => {
    if (submittingQuestions[index]) return;

    // Clear any previous errors for this question
    setQuestionErrors({ ...questionErrors, [index]: null });

    // Check if we have a response for this question (not applicable for notice)
    if (
      question.response_type === "text" &&
      (!responses[index] || responses[index]?.trim() === "")
    ) {
      setQuestionErrors({
        ...questionErrors,
        [index]: "Please enter a text response",
      });
      return;
    } else if (
      question.response_type === "file" &&
      (!files[index] || (Array.isArray(files[index]) && (files[index] as File[]).length === 0))
    ) {
      setQuestionErrors({
        ...questionErrors,
        [index]: "Please select a file to upload",
      });
      return;
    }

    // Set loading state
    setSubmittingQuestions({ ...submittingQuestions, [index]: true });

    try {
      let responseData;

      if (question.response_type === "text" && responses[index]) {
        console.log("Submitting text response for question", index);
        responseData = await submitQuestionResponse(loginKey, clientData?.client_name || "", index, question.question || "", question.response_type, responses[index] as string);
      } else if (question.response_type === "file" && files[index]) {
        console.log(
          "Submitting files for question",
          index,
          (files[index] as File[])?.map((f) => f.name).join(", ")
        );
        responseData = await submitQuestionResponse(loginKey, clientData?.client_name || "", index, question.question || "", question.response_type, undefined, files[index] as File[]);
      } else if (question.response_type === "notice") {
        // Auto-mark notice as submitted without calling upload API
        responseData = { fileIds: [] };
      }

      console.log("Submission response:", responseData);

      // Mark as submitted
      setSubmittedQuestions({ ...submittedQuestions, [index]: true });

      // Store submission in local state
      const newSubmittedFiles = { ...submittedFiles };
      if (question.response_type === "file" && files[index] && responseData) {
        const arr = files[index] as File[];
        newSubmittedFiles[index] = {
          name: `${arr.length} file${arr.length > 1 ? "s" : ""} uploaded`,
          type: "application/octet-stream",
          fileId: responseData.fileIds?.[0],
        };
      } else if (question.response_type === "notice") {
        newSubmittedFiles[index] = {
          name: "Notice acknowledged",
          type: "text/plain",
        };
      } else if (
        question.response_type === "text" &&
        responses[index] &&
        responseData
      ) {
        newSubmittedFiles[index] = {
          name: `Text Response (${new Date().toLocaleTimeString()})`,
          type: "text/plain",
          fileId: responseData.fileIds?.[0],
        };
      }
      setSubmittedFiles(newSubmittedFiles);

      // Clear form field after successful submission
      if (question.response_type === "text") {
        setResponses({ ...responses, [index]: null });
      } else if (question.response_type === "file") {
        setFiles({ ...files, [index]: null });
        // Reset the file input
        const fileInput = document.getElementById(
          `file-input-${index}`
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }
    } catch (err) {
      console.error(`Error submitting question ${index}:`, err);
      let errorMessage =
        err instanceof Error ? err.message : "Failed to submit response";

      // Add more specific error messages
      if (errorMessage.includes("upload")) {
        errorMessage =
          "Failed to upload file. Please try again with a smaller file or different format.";
      } else if (errorMessage.includes("Permission denied")) {
        errorMessage =
          "Permission denied while uploading file. Please try again or contact support.";
      }

      setQuestionErrors({
        ...questionErrors,
        [index]: errorMessage,
      });
    } finally {
      setSubmittingQuestions({ ...submittingQuestions, [index]: false });
    }
  };

  // Handle logout
  const handleLogout = () => {
    // Clear login key from localStorage
    localStorage.removeItem("clientLoginKey");
    // Redirect based on role
    if (signedIn) {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  };

  // Admin edit handlers
  const handleEditForm = () => {
    // Prefill edit fields from loaded client data
    setEditClientName(clientData?.client_name || "");
    setEditOrganization(clientData?.organization || "");
    setEditEmail(clientData?.email || "");
    setEditClientDescription(clientData?.description || "");
    setShowEditModal(true);
  };

  const handleUpdateForm = async (
    clientName: string,
    email: string,
    organization: string,
    clientDescription: string,
    updatedQuestions: AppQuestion[]
  ) => {
    if (!clientData) return;

    setIsUpdatingForm(true);
    setEditFormError(null);

    try {
      // Build uploads list from staged files (pending blue chips)
      const uploads: Array<{ qIndex: number; tIndex: number; questionText: string; file: File }>= [];
      const processedQuestions = updatedQuestions.map((q, idx) => {
        if ((q.response_type === "file" || q.response_type === "notice") && Array.isArray(q.templates) && q.templates.length > 0) {
          q.templates.forEach((t: any, tIdx: number) => {
            if (t && t.fileObject instanceof File) {
              uploads.push({ qIndex: idx, tIndex: tIdx, questionText: q.question || '', file: t.fileObject as File });
            }
          });
          return {
            ...q,
            templates: q.templates.map((t: any) => ({
              fileName: (t?.fileObject as File | undefined)?.name || t?.fileName,
              fileId: t?.fileId || "",
              uploadedAt: t?.uploadedAt || "",
            })),
          };
        }
        return { ...q, templates: q.templates && Array.isArray(q.templates) ? [...q.templates] : null };
      });

      if (uploads.length > 0) {
        setEditUploadNotice(`Uploading ${uploads.length} file(s)... Please keep this tab open. Large files may take several minutes.`);
        const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        beforeUnloadRef.current = handler;
        window.addEventListener('beforeunload', handler);

        // Direct client→Graph resumable uploads (bypasses Vercel)
        const chunkSize = 5 * 1024 * 1024;
        for (const item of uploads) {
          try {
            const sessionResp = await fetch('/api/uploads/create-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ loginKey, clientName, question: item.questionText, folderType: 'template', filename: item.file.name })
            });
            const js = await sessionResp.json();
            if (!sessionResp.ok || !js?.success || !js?.uploadUrl) {
              throw new Error(js?.error || 'Failed to create upload session');
            }
            let start = 0;
            let driveItemId: string | undefined = undefined;
            while (start < item.file.size) {
              const end = Math.min(start + chunkSize, item.file.size);
              const chunk = item.file.slice(start, end);
              const respUp = await fetch(js.uploadUrl as string, {
                method: 'PUT',
                headers: { 'Content-Length': String(chunk.size), 'Content-Range': `bytes ${start}-${end - 1}/${item.file.size}` },
                body: chunk,
              });
              if (!respUp.ok && respUp.status !== 202) {
                const t = await respUp.text().catch(() => '');
                throw new Error(`Upload failed: ${respUp.status} ${t}`);
              }
              if (end === item.file.size && respUp.ok) {
                try {
                  const jj: any = await respUp.json();
                  const id = jj?.id || jj?.resourceId || jj?.driveItem?.id;
                  if (typeof id === 'string') driveItemId = id;
                } catch {}
              }
              start = end;
            }
            await fetch('/api/uploads/finalize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ loginKey, question: item.questionText, mode: 'template', fileName: item.file.name, fileId: driveItemId })
            });
            // Reflect uploaded file in processedQuestions
            const q = processedQuestions[item.qIndex];
            if (q && Array.isArray((q as any).templates)) {
              const arr = [ ...((q as any).templates as any[]) ];
              arr[item.tIndex] = { fileName: item.file.name, fileId: driveItemId || arr[item.tIndex]?.fileId || '', uploadedAt: new Date().toISOString() };
              (processedQuestions as any)[item.qIndex] = { ...(q as any), templates: arr };
            }
          } catch (e) {
            console.error('Direct upload failed:', e);
          }
        }
      }

      // Update only metadata via JSON; no files in request body (bypass Vercel limits)
      const dbQuestions = convertToDbQuestions(processedQuestions);
      const data = await updateForm(loginKey, dbQuestions, {}, true, {
        clientName,
        email,
        organization,
        clientDescription,
      });

      if (data.success) {
        // Wait for any in-flight direct uploads to finish before reload
        const waitForUploads = async () => {
          const start = Date.now();
          while (pendingUploadsRef.current > 0 && Date.now() - start < 5 * 60 * 1000) {
            await new Promise((r) => setTimeout(r, 500));
          }
        };
        try { await waitForUploads(); } catch {}
        if (beforeUnloadRef.current) {
          try { window.removeEventListener('beforeunload', beforeUnloadRef.current as any); } catch {}
          beforeUnloadRef.current = null;
        }
        window.location.reload();
      } else {
        setEditFormError(
          data.error || "An error occurred while updating the form."
        );
      }
    } catch (err) {
      console.error("Error updating form:", err);
      setEditFormError(
        err instanceof Error ? err.message : "Failed to update form"
      );
    } finally {
      // Clear unload warning and notice
      if (beforeUnloadRef.current) {
        try { window.removeEventListener('beforeunload', beforeUnloadRef.current as any); } catch {}
        beforeUnloadRef.current = null;
      }
      setEditUploadNotice(null);
      setIsUpdatingForm(false);
    }
  };

  const resetEditForm = () => {
    setShowEditModal(false);
    setEditFormError(null);
    setIsUpdatingForm(false);
  };

  if (loading) {
    return <LoadingSpinner message="Loading your form..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <ErrorMessage message={error} />
          <button
            onClick={() => router.push("/")}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition mt-4"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const totalNonNoticeCount = questions.filter((q) => q.response_type !== 'notice').length;
  const completedCount = questions.reduce((acc, q, idx) => {
    if (q.response_type === 'notice') return acc;
    return acc + ((submittedQuestions[idx] || false) ? 1 : 0);
  }, 0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 w-full">
        {/* Header with logo */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 md:mb-8">
          <Link href="/">
            <div className="w-24 sm:w-32 md:w-40">
              <Image
                src="/logo-bridgewell.png"
                alt="Bridgewell Financial Logo"
                width={160}
                height={40}
                className="cursor-pointer"
              />
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {signedIn && (
              <button
                onClick={handleEditForm}
                className="flex justify-center font-semibold items-center gap-2 bg-secondary rounded-full text-white px-3 md:px-4 py-1.5 md:py-2.5 text-sm hover:bg-secondary-DARK transition"
                title="Edit form (Admin only)"
              >
                <FaEdit />
                <span className="hidden sm:inline">Edit Form</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex justify-center font-semibold items-center gap-2 md:gap-4 bg-primary rounded-full text-white px-3 md:px-4 py-1.5 md:py-2.5 text-sm"
            >
              <FaSignInAlt />
              <span className="hidden sm:inline">Exit form</span>
            </button>
          </div>
        </div>

        {/* Completion bar */}
        <CompletionBar
          completedCount={completedCount}
          totalCount={totalNonNoticeCount}
        />

        {clientData ? (
          <div>
            <div className="bg-primary rounded-xl shadow-lg p-6 sm:p-8 mb-6 md:mb-8 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                    Welcome,{" "}
                    <span className="text-secondary">
                      {clientData.client_name}
                    </span>
                  </h1>
                  <p className="text-lg sm:text-xl font-medium text-blue-100">
                    {clientData.organization}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:text-right space-y-2">
                  <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
                    <p className="text-sm font-medium text-blue-100 mb-1">
                      {signedIn
                        ? "The client last accessed this form on"
                        : "You last accessed this form on"}
                    </p>
                    <p className="text-lg font-bold">
                      {new Date(clientData.last_active_at || new Date()).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                    <p className="text-sm text-blue-200">
                      {new Date(clientData.last_active_at || new Date()).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        }
                      )}
                    </p>
                  </div>
                  {/* Removed admin shortcuts per request */}
                </div>
              </div>

              <div className="border-t border-white border-opacity-30 pt-4">
                <p className="text-base sm:text-lg text-blue-100 leading-relaxed">
                  Please complete{" "}
                  <span className="font-bold text-white">all questions</span>{" "}
                  below. If you need any help, feel free to reach out to your{" "}
                  <span className="font-bold text-secondary">
                    Bridgewell Financial Advisor
                  </span>
                  {clientData?.admin ? (
                    <>
                      :{" "}
                      <a href={`mailto:${clientData.admin}`} className="underline text-white">
                        {clientData.admin}
                      </a>
                    </>
                  ) : null}
                  .
                </p>
              </div>
            </div>

            {/* Questions list */}
            <div className="space-y-6 md:space-y-8">
              {questions.map((question, index) => (
                <QuestionCard
                  key={index}
                  question={question}
                  index={index}
                  isSubmitted={submittedQuestions[index] || false}
                  isSubmitting={submittingQuestions[index] || false}
                  error={questionErrors[index]}
                  textResponse={responses[index] || ""}
                  selectedFiles={files[index] as File[] | null}
                  onTextChange={(value) => handleTextChange(index, value)}
                  onFileChange={(file) => handleFileChange(index, file)}
                  onSubmit={() => handleSubmitQuestion(index, question)}
                  showAdminPanel={false}
                  loginKey={loginKey}
                  onRedoQuestion={() =>
                    deleteClientUploads(
                      loginKey,
                      clientData.client_name || "",
                      question.question || "",
                      index
                    )
                  }
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {checkingCompletion && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-11/12 max-w-md text-center shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Checking for form completion…</h2>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-2 w-1/3 animate-pulse"></div>
            </div>
            <p className="text-gray-600 text-sm mt-3">Please wait while we verify which questions are completed.</p>
          </div>
        </div>
      )}

      {/* Admin Edit Form Modal */}
      {clientData && showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 max-w-4xl w-full overflow-y-auto max-h-[95vh] sm:h-5/6">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary">
                Edit Form - {clientData.client_name}
              </h2>
              <button
                onClick={resetEditForm}
                className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl p-1"
              >
                ×
              </button>
            </div>

            {/* Client Info (Editable) */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Client Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    className="block w-full p-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={editOrganization}
                    onChange={(e) => setEditOrganization(e.target.value)}
                    className="block w-full p-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="block w-full p-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editClientDescription}
                    onChange={(e) => setEditClientDescription(e.target.value)}
                    className="block w-full p-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-primary h-[120px]"
                  />
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-primary">
                  Questions
                </h3>
                <p className="text-sm text-gray-600">Edit questions below</p>
              </div>

              {/* Warning about clearing submissions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Important Notice
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        You can safely edit question text, descriptions, due dates, and links - 
                        existing client submissions will be preserved. However, if you 
                        <strong> remove a question entirely</strong>, all client submissions 
                        and files for that question will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {editFormError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <p className="text-red-700">{editFormError}</p>
                </div>
              )}
              {editUploadNotice && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-blue-800 text-sm">{editUploadNotice}</p>
                </div>
              )}

              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div
                    key={index}
                    className={`border border-gray-200 rounded-xl p-4 ${((clearingTemplates[index]) || isUpdatingForm) ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-900">
                        Question {index + 1}
                      </h4>
                      <button
                        onClick={() => {
                          const newQuestions = questions.filter(
                            (_, i) => i !== index
                          );
                          setQuestions(newQuestions);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                          onClick={() => {
                            if (index === 0) return;
                            const arr = [...questions];
                            const tmp = arr[index - 1];
                            arr[index - 1] = arr[index];
                            arr[index] = tmp;
                            const withOrder = arr.map((q, i) => ({ ...q, order: i + 1 }));
                            setQuestions(withOrder);
                          }}
                          disabled={index === 0}
                        >
                          Move up
                        </button>
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                          onClick={() => {
                            if (index === questions.length - 1) return;
                            const arr = [...questions];
                            const tmp = arr[index + 1];
                            arr[index + 1] = arr[index];
                            arr[index] = tmp;
                            const withOrder = arr.map((q, i) => ({ ...q, order: i + 1 }));
                            setQuestions(withOrder);
                          }}
                          disabled={index === questions.length - 1}
                        >
                          Move down
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question Text
                        </label>
                        <input
                          type="text"
                          value={question.question || ""}
                          onChange={(e) => {
                            const newQuestions = [...questions];
                            newQuestions[index] = {
                              ...question,
                              question: e.target.value,
                            };
                            setQuestions(newQuestions);
                          }}
                          className="block w-full p-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-primary"
                        />
                      </div>
                      {(question.response_type === "file" || question.response_type === "notice") && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <label className="block text-sm font-medium text-blue-800 mb-2">
                            Template Documents <span className="text-blue-600 font-normal">(optional)</span>
                          </label>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.png,.xls,.xlsx,.xlsm"
                            onChange={async (e) => {
                              if (!e.target.files) return;
                              // Stage locally for immediate UI
                              handleTemplateUploadInEdit(index, e.target.files);
                              // Only stage locally; uploads will occur on Save
                              const filesList = Array.from(e.target.files);
                              e.currentTarget.value = '';
                            }}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-white"
                          />
                          {/* Pending (new) templates: blue chips with remove */}
                          {Array.isArray(question.templates) && (
                            (() => {
                              const pending = (question.templates || [])
                                .map((t, tIdx) => ({ t, tIdx }))
                                .filter((x: any) => !!(x.t as any).fileObject);
                              const uploaded = (question.templates || [])
                                .map((t, tIdx) => ({ t, tIdx }))
                                .filter((x: any) => !(x.t as any).fileObject && !!(x.t as any).fileId);
                              return (
                                <>
                                  {pending.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                      {pending.map(({ t, tIdx }: any) => (
                                        <div key={(t as any).fileName + tIdx} className="flex items-center justify-between bg-blue-100 px-3 py-2 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <span className="text-blue-800">📄</span>
                                            <span className="text-sm font-medium text-blue-700">
                                              {(t as any).fileObject?.name || (t as any).fileName}
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1 rounded"
                                            title="Remove pending template"
                                            onClick={() => {
                                              setQuestions((prev) => {
                                                const next = [...prev];
                                                const cur = next[index];
                                                const arr = Array.isArray(cur.templates) ? [...(cur.templates as any[])] : [];
                                                arr.splice(tIdx, 1);
                                                next[index] = { ...cur, templates: arr } as any;
                                                return next;
                                              });
                                            }}
                                          >
                                            <FaTimes className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {/* Already uploaded templates: green chips (informational) */}
                                  {uploaded.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                      {uploaded.map(({ t, tIdx }: any) => (
                                        <div key={(t as any).fileName + 'uploaded' + tIdx} className="flex items-center justify-between bg-green-100 px-3 py-2 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <span className="text-green-800">📄</span>
                                            <span className="text-sm font-medium text-green-700">
                                              {(t as any).fileName}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              );
                            })()
                          )}
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => handleClearTemplatesInEdit(index)}
                              className="text-sm px-3 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                            >
                              Clear already uploaded templates
                            </button>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={question.description || ""}
                          onChange={(e) => {
                            const newQuestions = [...questions];
                            newQuestions[index] = {
                              ...question,
                              description: e.target.value,
                            };
                            setQuestions(newQuestions);
                          }}
                          className="block w-full p-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-primary"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Response Type
                          </label>
                          <select
                            value={question.response_type || ""}
                            onChange={(e) => {
                              const newQuestions = [...questions];
                              newQuestions[index] = {
                                ...question,
                                response_type: e.target.value,
                              };
                              setQuestions(newQuestions);
                            }}
                            className="block w-full p-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-primary"
                          >
                            <option value="text">Text</option>
                            <option value="file">File Upload</option>
                            <option value="notice">No Response</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={question.due_date || ""}
                            onChange={(e) => {
                              const newQuestions = [...questions];
                              newQuestions[index] = {
                                ...question,
                                due_date: e.target.value,
                              };
                              setQuestions(newQuestions);
                            }}
                            className="block w-full p-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Link (Optional)
                          </label>
                          <input
                            type="url"
                            value={question.link || ""}
                            onChange={(e) => {
                              const newQuestions = [...questions];
                              newQuestions[index] = {
                                ...question,
                                link: e.target.value,
                              };
                              setQuestions(newQuestions);
                            }}
                            className="block w-full p-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-primary"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <button
                  onClick={() => {
                    const newQuestion: AppQuestion = {
                      question: "",
                      description: "",
                      response_type: "text",
                      due_date: new Date().toISOString().split("T")[0],
                      templates: null,
                      link: "",
                      created_at: new Date().toISOString(),
                      id: Date.now(), // temporary ID
                      login_key: loginKey,
                      order: (questions.length || 0) + 1,
                    };
                    setQuestions([...questions, newQuestion]);
                  }}
                  className="bg-secondary text-white px-3 py-2 rounded-lg font-medium text-sm hover:bg-secondary-DARK transition"
                >
                  + Add Question
                </button>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={resetEditForm}
                  className="px-6 py-3 rounded-xl font-bold border-2 border-gray-300 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleUpdateForm(
                      editClientName,
                      editEmail,
                      editOrganization,
                      editClientDescription,
                      questions
                    )
                  }
                  disabled={isUpdatingForm}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition flex items-center gap-2"
                >
                  {isUpdatingForm ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Form"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
