"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/app/utils/supabase/client";
import { Question } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  getClientFormData,
  getClientSubmissions,
  submitQuestionResponse,
} from "@/services/client";
import { ClientData } from "@/types";
import { redoQuestion } from "@/services/admin";

import CompletionBar from "@/components/pages/CompletionBar";
import QuestionCard from "@/components/pages/QuestionCard";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { FaSignInAlt } from "react-icons/fa";

export default function ClientFormPage() {
  const [signedIn, setSignedIn] = useState(false);
  const params = useParams();
  const router = useRouter();
  // Get the login key from the URL
  const loginKey = params.key as string;

  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<{
    [index: number]: string | null;
  }>({});
  const [files, setFiles] = useState<{ [index: number]: File | null }>({});
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

  // Check if questions are already completed
  const checkCompletionStatus = useCallback(async () => {
    try {
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
  }, [loginKey]);
  const checkSignedIn = useCallback(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthed = !!user?.aud;
    setSignedIn(isAuthed);
    if (isAuthed) {
      console.log("ADMIN IS SIGNED INTO FORM PAGE", signedIn);
    } else {
      console.log("ADMIN IS NOT SIGNED INTO FORM PAGE", signedIn);
      try {
        console.log("UPDATING LAST ACTIVE TIME", loginKey);
        const response = await fetch("/api/client/update-last-active-at", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loginKey }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error updating last active time:", errorData);
        } else {
          console.log("RESPONSE", await response.json());
          console.log("Updated last active time via API");
        }
      } catch (error) {
        console.error("Error updating last active time:", error);
      }
    }
  }, [signedIn, loginKey]);

  // Fetch client data and form questions
  useEffect(() => {
    async function fetchClientData() {
      if (!loginKey) {
        router.push("/");
        return;
      }

      try {
        // Store login key in localStorage for persistence
        localStorage.setItem("clientLoginKey", loginKey);

        const clientData = await getClientFormData(loginKey);
        setClientData(clientData);
        setQuestions(
          clientData.questions.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
        );

        // Initialize responses and status objects
        const initialResponses: { [index: number]: string | null } = {};
        const initialSubmitting: { [index: number]: boolean } = {};
        const initialSubmitted: { [index: number]: boolean } = {};
        const initialErrors: { [index: number]: string | null } = {};

        clientData.questions.forEach((_question: Question, index: number) => {
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

  const handleFileChange = (index: number, file: File | null) => {
    setFiles({ ...files, [index]: file });

    // Clear error when selecting a file
    if (questionErrors[index]) {
      setQuestionErrors({ ...questionErrors, [index]: null });
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

  const handleSubmitQuestion = async (index: number, question: Question) => {
    if (submittingQuestions[index]) return;

    // Clear any previous errors for this question
    setQuestionErrors({ ...questionErrors, [index]: null });

    // Check if we have a response for this question
    if (
      question.response_type === "text" &&
      (!responses[index] || responses[index]?.trim() === "")
    ) {
      setQuestionErrors({
        ...questionErrors,
        [index]: "Please enter a text response",
      });
      return;
    } else if (question.response_type === "file" && !files[index]) {
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
        responseData = await submitQuestionResponse(
          loginKey,
          index,
          question.question,
          question.response_type,
          responses[index] as string
        );
      } else if (question.response_type === "file" && files[index]) {
        console.log("Submitting file for question", index, files[index]?.name);
        responseData = await submitQuestionResponse(
          loginKey,
          index,
          question.question,
          question.response_type,
          undefined,
          files[index] as File
        );
      }

      console.log("Submission response:", responseData);

      // Mark as submitted
      setSubmittedQuestions({ ...submittedQuestions, [index]: true });

      // Store submission in local state
      const newSubmittedFiles = { ...submittedFiles };
      if (question.response_type === "file" && files[index] && responseData) {
        newSubmittedFiles[index] = {
          name: files[index].name,
          type: files[index].type,
          fileId: responseData.fileId,
        };
      } else if (
        question.response_type === "text" &&
        responses[index] &&
        responseData
      ) {
        newSubmittedFiles[index] = {
          name: `Text Response (${new Date().toLocaleTimeString()})`,
          type: "text/plain",
          fileId: responseData.fileId,
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
      } else if (errorMessage.includes("File is too large")) {
        errorMessage = "File is too large. Please upload a smaller file.";
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
    // Redirect to client login page
    router.push("/");
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

  const completedCount =
    Object.values(submittedQuestions).filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
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

          <button
            onClick={handleLogout}
            className="flex justify-center font-semibold items-center gap-2 md:gap-4 bg-primary rounded-full text-white px-3 md:px-4 py-1.5 md:py-2.5 text-sm"
          >
            <FaSignInAlt />
            <span className="hidden sm:inline">Exit form</span>
          </button>
        </div>

        {/* Completion bar */}
        <CompletionBar
          completedCount={completedCount}
          totalCount={questions.length}
        />

        {clientData ? (
          <div>
            <div className="bg-primary rounded-xl shadow-lg p-6 sm:p-8 mb-6 md:mb-8 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                    Welcome,{" "}
                    <span className="text-secondary">
                      {clientData.clientName}
                    </span>
                  </h1>
                  <p className="text-lg sm:text-xl font-medium text-blue-100">
                    {clientData.organization}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:text-right">
                  <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
                    <p className="text-sm font-medium text-blue-100 mb-1">
                      {signedIn
                        ? "The client last accessed this form on"
                        : "You last accessed this form on"}
                    </p>
                    <p className="text-lg font-bold">
                      {new Date(clientData.last_active_at).toLocaleDateString(
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
                      {new Date(clientData.last_active_at).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        }
                      )}
                    </p>
                  </div>
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
                  selectedFile={files[index]}
                  onTextChange={(value) => handleTextChange(index, value)}
                  onFileChange={(file) => handleFileChange(index, file)}
                  onSubmit={() => handleSubmitQuestion(index, question)}
                  showAdminPanel={signedIn}
                  onRedoQuestion={() =>
                    deleteClientUploads(
                      loginKey,
                      clientData.clientName,
                      question.question,
                      index
                    )
                  }
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
