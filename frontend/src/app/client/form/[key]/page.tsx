"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
    const params = useParams();
    const router = useRouter();
    const loginKey = params.key as string;

    const [clientData, setClientData] = useState<ClientData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [responses, setResponses] = useState<{ [index: number]: string | null }>({});
    const [files, setFiles] = useState<{ [index: number]: File | null }>({});
    const [submittingQuestions, setSubmittingQuestions] = useState<{ [index: number]: boolean }>({});
    const [submittedQuestions, setSubmittedQuestions] = useState<{ [index: number]: boolean }>({});
    const [questionErrors, setQuestionErrors] = useState<{ [index: number]: string | null }>({});
    const [submittedFiles, setSubmittedFiles] = useState<{ [index: number]: { name: string, type: string, fileId?: string } }>({});

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
        <div className="min-h-screen p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <div className="w-24 bg-gray-200 rounded-full px-4 py-2 mb-4">
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
                <h1 className="text-3xl font-bold text-primary mb-2">Welcome, {clientData?.clientName}</h1>
                <p className="text-gray-600">
                    Please complete the following form for {clientData?.organization}
                </p>
            </div>

            <div className="space-y-8">
                {clientData?.questions.map((question, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <span className="bg-primary text-white text-sm py-1 px-3 rounded-full">
                                    Question {index + 1}
                                </span>
                                {question.dueDate && (
                                    <span className="ml-3 text-gray-600 text-sm">
                                        Due by: {new Date(question.dueDate).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            
                            {submittedQuestions[index] && (
                                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                    Completed
                                </div>
                            )}
                        </div>
                        
                        <h3 className="text-xl font-medium mb-2">{question.question}</h3>
                        
                        {question.description && (
                            <p className="text-gray-600 mb-4">{question.description}</p>
                        )}
                        
                        <div className="mt-4">
                            {question.responseType === "text" ? (
                                <div>
                                    <textarea
                                        value={responses[index] as string || ""}
                                        onChange={(e) => handleTextChange(index, e.target.value)}
                                        placeholder="Type your answer here..."
                                        rows={4}
                                        className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl resize-none"
                                    ></textarea>
                                    
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleSubmitQuestion(index, question)}
                                            disabled={submittingQuestions[index]}
                                            className={`bg-primary text-white px-6 py-2 rounded-xl font-medium hover:bg-primary-DARK transition
                                                ${submittingQuestions[index] ? "opacity-70 cursor-not-allowed" : ""}`}
                                        >
                                            {submittingQuestions[index] ? (
                                                <span className="flex items-center">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Submitting...
                                                </span>
                                            ) : "Submit Answer"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="flex flex-col items-center px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                                        <div className="flex flex-col items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <p className="mt-2 text-sm text-gray-600">
                                                {files[index] ? files[index]!.name : "Click to upload or drag and drop"}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Supported files: PDF, DOC, DOCX, XLSX, JPG, PNG, etc.
                                            </p>
                                        </div>
                                        <input
                                            id={`file-input-${index}`}
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => handleFileChange(index, e)}
                                        />
                                    </label>
                                    
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleSubmitQuestion(index, question)}
                                            disabled={submittingQuestions[index] || !files[index]}
                                            className={`bg-primary text-white px-6 py-2 rounded-xl font-medium hover:bg-primary-DARK transition
                                                ${(submittingQuestions[index] || !files[index]) ? "opacity-70 cursor-not-allowed" : ""}`}
                                        >
                                            {submittingQuestions[index] ? (
                                                <span className="flex items-center">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Uploading...
                                                </span>
                                            ) : "Upload File"}
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {questionErrors[index] && (
                                <div className="mt-2 text-red-500 text-sm">
                                    {questionErrors[index]}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-10 text-center">
                <Link href="/client">
                    <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition">
                        Back to Login
                    </button>
                </Link>
            </div>
        </div>
    );
} 