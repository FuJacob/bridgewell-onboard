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
    const [responses, setResponses] = useState<{ [index: number]: string | File | null }>({});
    const [files, setFiles] = useState<{ [index: number]: File | null }>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Fetch client data and form questions
    useEffect(() => {
        async function fetchClientData() {
            if (!loginKey) {
                router.push("/client");
                return;
            }

            try {
                const response = await fetch(`/api/client/form-data?key=${encodeURIComponent(loginKey)}`);
                
                if (!response.ok) {
                    throw new Error("Invalid key or form not found");
                }

                const data = await response.json();
                setClientData(data);
                
                // Initialize responses object
                const initialResponses: { [index: number]: string | File | null } = {};
                data.questions.forEach((_: Question, index: number) => {
                    initialResponses[index] = "";
                });
                setResponses(initialResponses);
                
            } catch (err) {
                console.error("Error fetching form data:", err);
                setError("Failed to load form. Please check your login key and try again.");
            } finally {
                setLoading(false);
            }
        }

        fetchClientData();
    }, [loginKey, router]);

    const handleTextChange = (index: number, value: string) => {
        setResponses({ ...responses, [index]: value });
    };

    const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setFiles({ ...files, [index]: file });
            setResponses({ ...responses, [index]: file });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            // Create a FormData object to handle file uploads
            const formData = new FormData();
            formData.append("loginKey", loginKey);
            
            // Add client information
            if (clientData) {
                formData.append("clientId", clientData.id);
                formData.append("clientName", clientData.clientName);
            }
            
            // Add responses
            const responsesData: any = {};
            
            clientData?.questions.forEach((question, index) => {
                if (question.responseType === "file" && files[index]) {
                    // For file uploads, add to FormData
                    formData.append(`file_${index}`, files[index] as File);
                    responsesData[index] = { 
                        questionText: question.question,
                        responseType: "file",
                        fileName: (files[index] as File).name
                    };
                } else {
                    // For text responses
                    responsesData[index] = { 
                        questionText: question.question,
                        responseType: "text",
                        textResponse: responses[index] as string 
                    };
                }
            });
            
            formData.append("responses", JSON.stringify(responsesData));
            
            // Submit the form data
            const response = await fetch("/api/client/submit-form", {
                method: "POST",
                body: formData,
            });
            
            if (!response.ok) {
                throw new Error("Failed to submit form");
            }
            
            // Show success message
            setSubmitted(true);
            
        } catch (err) {
            console.error("Error submitting form:", err);
            setError("Failed to submit form. Please try again.");
        } finally {
            setSubmitting(false);
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

    if (submitted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md text-center">
                    <div className="w-24 bg-gray-200 rounded-full px-4 py-2 mb-4 mx-auto">
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
                    <h1 className="text-3xl font-bold text-primary mb-4">Form Submitted!</h1>
                    <p className="text-gray-600 mb-8">Thank you for completing your form. We'll be in touch soon.</p>
                    <button
                        onClick={() => router.push("/client")}
                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition"
                    >
                        Back to Home
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

            <form onSubmit={handleSubmit} className="space-y-8">
                {clientData?.questions.map((question, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <div className="mb-4">
                            <span className="bg-primary text-white text-sm py-1 px-3 rounded-full">
                                Question {index + 1}
                            </span>
                            {question.dueDate && (
                                <span className="ml-3 text-gray-600 text-sm">
                                    Due by: {new Date(question.dueDate).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        
                        <h3 className="text-xl font-medium mb-2">{question.question}</h3>
                        
                        {question.description && (
                            <p className="text-gray-600 mb-4">{question.description}</p>
                        )}
                        
                        {question.responseType === "text" ? (
                            <textarea
                                value={responses[index] as string || ""}
                                onChange={(e) => handleTextChange(index, e.target.value)}
                                placeholder="Type your answer here..."
                                rows={4}
                                className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl resize-none"
                            ></textarea>
                        ) : (
                            <div className="mt-4">
                                <label className="flex flex-col items-center px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                                    <div className="flex flex-col items-center">
                                        {files[index] ? (
                                            <>
                                                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                <span className="mt-2 text-base text-gray-700">
                                                    {(files[index] as File).name}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                                </svg>
                                                <span className="mt-2 text-base text-gray-600">
                                                    Click to upload a file
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={(e) => handleFileChange(index, e)}
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                ))}

                {clientData?.questions && clientData.questions.length > 0 && (
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`w-full bg-primary text-white py-3 px-4 rounded-xl font-bold transition 
                            ${submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-DARK'}`}
                    >
                        {submitting ? 'Submitting...' : 'Submit Form'}
                    </button>
                )}
            </form>
        </div>
    );
} 