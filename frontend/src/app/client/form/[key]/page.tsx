"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/app/utils/supabase/client";
import {deleteClientUploadsToQuestion} from "@/app/utils/microsoft/graph";
type Question = {
    question: string;
    description: string;
    responseType: string;
    dueDate: string;
};

type ClientData = {
    id: string;
    clientName: string;
    organization: string;
    questions: Question[];
};

export default function ClientFormPage() {
    const [signedIn, setSignedIn] = useState(false);
    const params = useParams();
    const router = useRouter();
    const loginKey = params.key as string;

    const [clientData, setClientData] = useState<ClientData | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [responses, setResponses] = useState<{ [index: number]: string | null }>({});
    const [files, setFiles] = useState<{ [index: number]: File | null }>({});
    const [submittingQuestions, setSubmittingQuestions] = useState<{ [index: number]: boolean }>({});
    const [submittedQuestions, setSubmittedQuestions] = useState<{ [index: number]: boolean }>({});
    const [questionErrors, setQuestionErrors] = useState<{ [index: number]: string | null }>({});
    const [submittedFiles, setSubmittedFiles] = useState<{ [index: number]: { name: string, type: string, fileId?: string } }>({});

    // Calculate completion percentage
    const calculateCompletionPercentage = () => {
        if (!questions || questions.length === 0) return 0;
        
        const completedCount = Object.values(submittedQuestions).filter(Boolean).length;
        return Math.round((completedCount / questions.length) * 100);
    };

    // Build a status message based on completion
    const getCompletionStatus = () => {
        const percentage = calculateCompletionPercentage();
        if (percentage === 100) return "Form Complete!";
        if (percentage === 0) return "Form Not Started";
        return `${percentage}% Complete`;
    };


    // delete question client uploads

    
    // Fetch client data and form questions
    useEffect(() => {
        async function fetchClientData() {
            if (!loginKey) {
                router.push("/client");
                return;
            }

            try {
                // Store login key in localStorage for persistence
                localStorage.setItem("clientLoginKey", loginKey);
                
                const response = await fetch(`/api/client/form-data?key=${encodeURIComponent(loginKey)}`);
                
                if (!response.ok) {
                    throw new Error("Invalid key or form not found");
                }

                const data = await response.json();
                setClientData(data);
                setQuestions(data.questions);
                
                // Initialize responses and status objects
                const initialResponses: { [index: number]: string | null } = {};
                const initialSubmitting: { [index: number]: boolean } = {};
                const initialSubmitted: { [index: number]: boolean } = {};
                const initialErrors: { [index: number]: string | null } = {};
                
                data.questions.forEach((_: Question, index: number) => {
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
                checkCompletionStatus(data);
                
            } catch (err) {
                console.error("Error fetching form data:", err);
                setError("Failed to load form. Please check your login key and try again.");
                localStorage.removeItem("clientLoginKey");
            } finally {
                setLoading(false);
            }
        }

        fetchClientData();
    }, [loginKey, router]);

    // Check if questions are already completed
    const checkCompletionStatus = async (data: ClientData) => {
        try {
            const response = await fetch(`/api/client/submissions?key=${encodeURIComponent(loginKey)}`);
            
            if (response.ok) {
                const submissionData = await response.json();
                
                if (submissionData && submissionData.responses) {
                    const completedQuestions: { [index: number]: boolean } = {};
                    
                    Object.keys(submissionData.responses).forEach(index => {
                        const questionIndex = parseInt(index);
                        completedQuestions[questionIndex] = true;
                    });
                    
                    setSubmittedQuestions(completedQuestions);
                }
            }
        } catch (err) {
            console.error("Error checking completion status:", err);
        }
    };

    const handleTextChange = (index: number, value: string) => {
        setResponses({ ...responses, [index]: value });
        
        // Clear error when typing
        if (questionErrors[index]) {
            setQuestionErrors({ ...questionErrors, [index]: null });
        }
    };

    const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setFiles({ ...files, [index]: file });
            
            // Clear error when selecting a file
            if (questionErrors[index]) {
                setQuestionErrors({ ...questionErrors, [index]: null });
            }
        }
    };

    const handleSubmitQuestion = async (index: number, question: Question) => {
        if (submittingQuestions[index]) return;
        
        // Clear any previous errors for this question
        setQuestionErrors({ ...questionErrors, [index]: null });
        
        // Check if we have a response for this question
        if (question.responseType === "text" && (!responses[index] || responses[index]?.trim() === "")) {
            setQuestionErrors({ ...questionErrors, [index]: "Please enter a text response" });
            return;
        } else if (question.responseType === "file" && !files[index]) {
            setQuestionErrors({ ...questionErrors, [index]: "Please select a file to upload" });
            return;
        }
        
        // Set loading state
        setSubmittingQuestions({ ...submittingQuestions, [index]: true });
        
        try {
            const formData = new FormData();
            formData.append("loginKey", loginKey);
            formData.append("questionIndex", index.toString());
            formData.append("questionText", question.question);
            formData.append("responseType", question.responseType);
            
            if (question.responseType === "text" && responses[index]) {
                formData.append("textResponse", responses[index] as string);
                console.log("Submitting text response for question", index);
            } else if (question.responseType === "file" && files[index]) {
                formData.append("file", files[index] as File);
                console.log("Submitting file for question", index, files[index]?.name);
            }
            
            const response = await fetch("/api/client/submit-question", {
                method: "POST",
                body: formData,
            });
            
            const responseData = await response.json();
            console.log("Submission response:", responseData);
            
            if (!response.ok) {
                console.error("Submission error response:", responseData);
                throw new Error(responseData.error || "Failed to submit response");
            }
            
            // Mark as submitted
            setSubmittedQuestions({ ...submittedQuestions, [index]: true });
            
            // Store submission in local state
            const newSubmittedFiles = { ...submittedFiles };
            if (question.responseType === "file" && files[index]) {
                newSubmittedFiles[index] = {
                    name: files[index].name,
                    type: files[index].type,
                    fileId: responseData.fileId
                };
            } else if (question.responseType === "text" && responses[index]) {
                newSubmittedFiles[index] = {
                    name: `Text Response (${new Date().toLocaleTimeString()})`,
                    type: "text/plain",
                    fileId: responseData.fileId
                };
            }
            setSubmittedFiles(newSubmittedFiles);
            
            // Clear form field after successful submission
            if (question.responseType === "text") {
                setResponses({ ...responses, [index]: null });
            } else if (question.responseType === "file") {
                setFiles({ ...files, [index]: null });
                // Reset the file input
                const fileInput = document.getElementById(`file-input-${index}`) as HTMLInputElement;
                if (fileInput) fileInput.value = "";
            }
            
        } catch (err) {
            console.error(`Error submitting question ${index}:`, err);
            let errorMessage = err instanceof Error ? err.message : "Failed to submit response";
            
            // Add more specific error messages
            if (errorMessage.includes("upload")) {
                errorMessage = "Failed to upload file. Please try again with a smaller file or different format.";
            } else if (errorMessage.includes("Permission denied")) {
                errorMessage = "Permission denied while uploading file. Please try again or contact support.";
            } else if (errorMessage.includes("File is too large")) {
                errorMessage = "File is too large. Please upload a smaller file.";
            }
            
            setQuestionErrors({ 
                ...questionErrors, 
                [index]: errorMessage
            });
        } finally {
            setSubmittingQuestions({ ...submittingQuestions, [index]: false });
        }
    };





    
  async function checkSignedIn() {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthed = !!user?.aud;

    console.log("USER AID IS HERE", isAuthed);

    if (isAuthed) {
      setSignedIn(prev => !prev);
      console.log("ADMIN IS SIGNED INTO FORM PAGE")
    }
    }
    

  // Handle client-side mounting
  useEffect(() => {
    checkSignedIn();
  }, []);

    
    
    
    // Handle logout
    const handleLogout = () => {
        // Clear login key from localStorage
        localStorage.removeItem("clientLoginKey");
        // Redirect to client login page
        router.push("/client");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4">Loading your form...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md text-center">
                    <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
                    <button
                        onClick={() => router.push("/client")}
                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }



    
    
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto p-6">
                {/* Header with logo */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/">
                        <div className="w-40">
                            <Image
                                src="/logo-bridgewell.png"
                                alt="Bridgewell Financial Logo"
                                width={160}
                                height={40}
                                layout="responsive"
                                className="cursor-pointer"
                            />
                        </div>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="text-primary hover:underline text-sm"
                    >
                        Logout
                    </button>
                </div>

                {/* Completion bar */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-medium">
                            {getCompletionStatus()}
                        </h2>
                        <span className="text-sm text-gray-500">
                            {Object.values(submittedQuestions).filter(Boolean).length} of {questions.length} completed
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                            className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${calculateCompletionPercentage()}%` }}
                        ></div>
                    </div>
                </div>

                {/* Loading state */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : error ? (
                    <div className="p-4 mb-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                        <p>{error}</p>
                    </div>
                ) : clientData ? (
                    <div>
                        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                            <h1 className="text-2xl font-bold mb-2">Welcome, {clientData.clientName}</h1>
                            <p className="text-gray-600 mb-4">
                                Please complete all questions below. Your progress is saved automatically.
                            </p>
                        </div>

                        {/* Questions list */}
                        <div className="space-y-8">
                            {questions.map((question, index) => (
                                <div 
                                    key={index} 
                                    className={`bg-white rounded-xl shadow-md p-6 transition-all duration-300
                                        ${submittedQuestions[index] ? 'bg-green-50 border-l-4 border-green-500' : ''}`}
                                >
                                    <div className="flex items-center justify-between gap-2"><h2 className="text-xl font-semibold mb-2">
                                        {question.question}
                                        {submittedQuestions[index] && (
                                            <span className="ml-2 text-green-600 text-sm font-normal">
                                                ✓ Completed
                                            </span>
                                            
                                        )}
                                           </h2>
                                        <div className="bg-red-200 flex flex-col gap-2 justify-center items-center p-4 rounded-3xl"><h3 className="text-red-400 font-semibold">Admin Panel</h3><button onClick={async () => {
                                            const deleteClientUploads = await deleteClientUploadsToQuestion(clientData.id, clientData.clientName, question.question)
                                            if (deleteClientUploads) {
                                                router.push(`/client/form/${loginKey}`);
                                            }
                                            else {
                                                console.log("Error deleting client uploads");
                                            }
                                        }} className="bg-red-500 px-3 py-2 rounded-full text-xs font-semibold text-white">Make client redo this question</button></div>
                                 </div>
                                    <p className="text-gray-600 mb-4">{question.description}</p>
                                    
                                    {question.responseType === "text" ? (
                                        <div>
                                            <textarea
                                                value={responses[index] || ""}
                                                onChange={(e) => handleTextChange(index, e.target.value)}
                                                placeholder="Type your response here..."
                                                className="w-full border-2 border-gray-300 rounded-lg p-3 mb-3 focus:border-primary focus:ring-primary"
                                                rows={4}
                                                disabled={submittingQuestions[index] || submittedQuestions[index]}
                                            ></textarea>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="flex flex-col items-center px-4 py-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                                                <div className="flex flex-col items-center">
                                                    <svg className="w-8 h-8 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                                    </svg>
                                                    <p className="mb-1 text-sm text-gray-700">
                                                        {files[index] ? files[index]?.name : "Click to upload or drag and drop"}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Allowed file types: PDF, DOC, DOCX, JPG, PNG
                                                    </p>
                                                </div>
                                                <input
                                                    id={`file-input-${index}`}
                                                    type="file"
                                                    onChange={(e) => handleFileChange(index, e)}
                                                    className="hidden"
                                                    disabled={submittingQuestions[index] || submittedQuestions[index]}
                                                />
                                            </label>
                                            
                                            {files[index] && (
                                                <div className="mt-2 flex items-center p-2 bg-gray-50 rounded-lg">
                                                    <svg className="w-4 h-4 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                    </svg>
                                                    <span className="text-sm text-gray-700">File selected: {files[index]?.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {questionErrors[index] && (
                                        <div className="text-red-500 text-sm mt-2">{questionErrors[index]}</div>
                                    )}
                                    
                                    <div className="mt-4">
                                        <button
                                            onClick={() => handleSubmitQuestion(index, question)}
                                            disabled={
                                                submittingQuestions[index] || 
                                                submittedQuestions[index] || 
                                                (question.responseType === "text" && !responses[index]) || 
                                                (question.responseType === "file" && !files[index])
                                            }
                                            className={`px-4 py-2 rounded-lg font-medium ${
                                                submittedQuestions[index]
                                                    ? "bg-green-100 text-green-600 cursor-default"
                                                    : "bg-primary text-white hover:bg-primary-dark"
                                            } transition-colors ${
                                                submittingQuestions[index] ? "opacity-70 cursor-not-allowed" : ""
                                            }`}
                                        >
                                            {submittingQuestions[index] ? (
                                                <span className="flex items-center">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Submitting...
                                                </span>
                                            ) : submittedQuestions[index] ? (
                                                "Submitted"
                                            ) : (
                                                "Submit Response"
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
} 