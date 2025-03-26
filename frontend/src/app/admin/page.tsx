"use client";
import { useState } from "react";
import Image from "next/image";

export default function AdminPage() {
    const [showForm, setShowForm] = useState(false);
    const [clientName, setClientName] = useState("");
    const [organization, setOrganization] = useState("");
    const [questions, setQuestions] = useState<{ 
        question: string; 
        description: string; 
        responseType: string;
    }[]>([]);
    const [loginKey, setLoginKey] = useState<string | null>(null);

    const addQuestion = () => {
        setQuestions([...questions, { 
            question: "", 
            description: "", 
            responseType: "text" 
        }]);
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

    const handleSubmit = async () => {
        const formData = {
            clientName,
            organization,
            questions,
        };

        console.log("Submitting:", formData);

        const response = await fetch("/api/admin/create-form", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (data.loginKey) {
            setLoginKey(data.loginKey);
        } else {
            alert(data.error || "An error occurred.");
        }
    };

    // If loginKey exists, show the success page
    if (loginKey) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center">
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
                <p className="text-3xl font-mono bg-gray-100 p-6 rounded-2xl mt-4 border-2 border-secondary">{loginKey}</p>
                <button 
                    onClick={() => setLoginKey(null)}
                    className="mt-8 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition"
                >
                    Create Another Form
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="w-28 bg-gray-200 rounded-full px-4 py-2 mb-4">
                <Image
                    src="/logo-bridgewell.png"
                    alt="Bridgewell Financial Logo"
                    width={100}
                    height={100}
                    layout="responsive"
                />
            </div>
            <h1 className="text-4xl font-bold mb-6 text-primary">Admin Panel</h1>
            <p className="text-lg mb-8">Create customized forms for client onboarding</p>

            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition"
                >
                    Generate New Client Form
                </button>
            ) : (
                <div className="space-y-6 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-semibold text-primary">Client Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Client Name</label>
                            <input
                                type="text"
                                placeholder="Enter client name"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Organization</label>
                            <input
                                type="text"
                                placeholder="Enter organization name"
                                value={organization}
                                onChange={(e) => setOrganization(e.target.value)}
                                className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6 mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-primary">Questions</h2>
                            <button
                                onClick={addQuestion}
                                className="bg-secondary text-white px-4 py-2 rounded-xl font-medium"
                            >
                                + Add Question
                            </button>
                        </div>
                        
                        {questions.length === 0 && (
                            <div className="text-center py-8 bg-gray-50 rounded-xl">
                                <p className="text-gray-500">No questions added yet. Click "Add Question" to get started.</p>
                            </div>
                        )}
                        
                        {questions.map((q, index) => (
                            <div key={index} className="mb-6 p-6 border-2 border-gray-200 rounded-xl bg-gray-50">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-primary text-white text-sm py-1 px-3 rounded-full">Question {index + 1}</span>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => moveQuestionUp(index)}
                                            disabled={index === 0}
                                            className={`p-2 rounded ${index === 0 ? 'text-gray-400' : 'text-primary hover:bg-gray-200'}`}
                                        >
                                            ↑
                                        </button>
                                        <button
                                            onClick={() => moveQuestionDown(index)}
                                            disabled={index === questions.length - 1}
                                            className={`p-2 rounded ${index === questions.length - 1 ? 'text-gray-400' : 'text-primary hover:bg-gray-200'}`}
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
                                        <label className="block text-sm font-medium mb-1">Question</label>
                                        <input
                                            type="text"
                                            value={q.question}
                                            onChange={(e) => updateQuestion(index, e.target.value)}
                                            placeholder="Enter your question"
                                            className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Description (optional)</label>
                                        <input
                                            type="text"
                                            value={q.description}
                                            onChange={(e) => updateDescription(index, e.target.value)}
                                            placeholder="Add a short description or hint for this question"
                                            className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Response Type</label>
                                        <select
                                            value={q.responseType}
                                            onChange={(e) => updateResponseType(index, e.target.value)}
                                            className="block w-full p-3 border-2 border-gray-300 focus:border-primary focus:ring-primary rounded-xl bg-white"
                                        >
                                            <option value="text">Text Response</option>
                                            <option value="file">File Upload</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {questions.length > 0 && (
                            <button
                                onClick={handleSubmit}
                                className="mt-6 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition w-full md:w-auto"
                            >
                                Generate Client Form
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
