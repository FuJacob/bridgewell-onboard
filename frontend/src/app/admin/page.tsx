"use client";
import { useState } from "react";

export default function AdminPage() {
    const [showForm, setShowForm] = useState(false);
    const [clientName, setClientName] = useState("");
    const [organization, setOrganization] = useState("");
    const [questions, setQuestions] = useState<{ question: string; responseType: string }[]>([]);
    const [loginKey, setLoginKey] = useState<string | null>(null);

    const addQuestion = () => {
        setQuestions([...questions, { question: "", responseType: "text" }]);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[index].question = value;
        setQuestions(newQuestions);
    };

    const updateResponseType = (index: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[index].responseType = value;
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
            setLoginKey(data.loginKey); // Save the login key
        } else {
            alert(data.error || "An error occurred.");
        }
    };

    // If loginKey exists, show the success page
    if (loginKey) {
        return (
            <div className="p-6 text-center">
                <h1 className="text-2xl font-bold mb-4 text-green-600">
                    Client Form Generated Successfully!
                </h1>
                <p className="text-lg">Here is your 16-character client login key:</p>
                <p className="text-3xl font-mono bg-gray-200 p-4 rounded-lg mt-4">{loginKey}</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>

            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Generate New Client Form
                </button>
            ) : (
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Client Name"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="block w-full p-2 border rounded"
                    />
                    <input
                        type="text"
                        placeholder="Organization"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        className="block w-full p-2 border rounded"
                    />

                    <h2 className="text-xl font-semibold">Questions:</h2>
                    {questions.map((q, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={q.question}
                                onChange={(e) => updateQuestion(index, e.target.value)}
                                placeholder="Enter a question"
                                className="p-2 border rounded flex-grow"
                            />
                            <select
                                value={q.responseType}
                                onChange={(e) => updateResponseType(index, e.target.value)}
                                className="p-2 border rounded"
                            >
                                <option value="text">Text</option>
                                <option value="file">File</option>
                            </select>
                            <button
                                onClick={() => removeQuestion(index)}
                                className="bg-red-500 text-white px-2 py-1 rounded"
                            >
                                Remove
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={addQuestion}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                        + Add Question
                    </button>

                    <button
                        onClick={handleSubmit}
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Submit Form
                    </button>
                </div>
            )}
        </div>
    );
}
