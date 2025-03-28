"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/app/utils/supabase/client";

type FormData = {
  id: string;
  client_name: string;
  organization: string;
  questions: string;
  login_key: string;
};

type FormSubmission = {
  id: string;
  client_id: string;
  client_name: string;
  login_key: string;
  responses: string;
  submitted_at: string;
};

export default function SubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<FormData | null>(null);
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!params.key) {
        router.push("/dashboard");
        return;
      }

      try {
        const supabase = createClient();

        // Fetch form data
        const { data: formData, error: formError } = await supabase
          .from("clients")
          .select("*")
          .eq("login_key", params.key)
          .single();

        if (formError) {
          console.error("Error fetching form data:", formError);
          setError("Failed to load form data");
        } else {
          setForm(formData);
        }

        // Fetch submission data
        const { data: submissionData, error: submissionError } = await supabase
          .from("submissions")
          .select("*")
          .eq("login_key", params.key)
          .single();

        if (submissionError) {
          console.error("Error fetching submission data:", submissionError);
          setError((error) => error || "Failed to load submission data");
        } else {
          setSubmission(submissionData);
        }
      } catch (err) {
        console.error("Error fetching submission data:", err);
        setError("Failed to load submission data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.key, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (!form || !submission) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="w-16 bg-gray-200 rounded-full px-2 py-1">
                <Link href="/">
                  <Image
                    src="/logo-bridgewell.png"
                    alt="Bridgewell Financial Logo"
                    width={60}
                    height={60}
                    layout="responsive"
                    className="cursor-pointer"
                  />
                </Link>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary mb-1">
                  Form Submission
                </h1>
                {error && <p className="text-red-500">{error}</p>}
              </div>
            </div>
            <Link
              href="/dashboard"
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition"
            >
              Back to Dashboard
            </Link>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            <h2 className="mt-4 text-xl font-medium text-gray-900">
              Submission not found
            </h2>
            <p className="mt-2 text-gray-500">
              {error ||
                "The form submission you're looking for could not be found. It may have been deleted or never existed."}
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 mr-3 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const questions = JSON.parse(form.questions);
  const responses = JSON.parse(submission.responses);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div className="w-16 bg-gray-200 rounded-full px-2 py-1">
              <Link href="/">
                <Image
                  src="/logo-bridgewell.png"
                  alt="Bridgewell Financial Logo"
                  width={60}
                  height={60}
                  layout="responsive"
                  className="cursor-pointer"
                />
              </Link>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary mb-1">
                Form Submission
              </h1>
              <p className="text-gray-600">
                Submitted on{" "}
                {new Date(submission.submitted_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-DARK transition"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Client Information */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-primary mb-4">
            Client Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Client Name</p>
              <p className="font-medium">{form.client_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Organization</p>
              <p className="font-medium">{form.organization}</p>
            </div>
          </div>
        </div>

        {/* Responses */}
        <div className="space-y-6">
          {Object.entries(responses).map(([index, response]: [string, any]) => {
            const question = questions[parseInt(index)];
            return (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
              >
                <div className="mb-4">
                  <span className="bg-primary text-white text-sm py-1 px-3 rounded-full">
                    Question {parseInt(index) + 1}
                  </span>
                </div>

                <h3 className="text-lg font-medium mb-2">
                  {response.questionText}
                </h3>

                {response.responseType === "file" ? (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">File Upload</p>
                    {response.fileUrl ? (
                      <a
                        href={response.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-DARK flex items-center gap-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          ></path>
                        </svg>
                        {response.fileName}
                      </a>
                    ) : (
                      <p className="text-gray-500">No file uploaded</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Text Response</p>
                    <p className="bg-gray-50 p-4 rounded-xl whitespace-pre-wrap">
                      {response.textResponse}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
