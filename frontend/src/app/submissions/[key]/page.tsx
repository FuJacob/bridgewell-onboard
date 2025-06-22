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

interface ResponseData {
  questionText: string;
  responseType: string;
  fileUrl?: string;
  fileName?: string;
  textResponse?: string;
}

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
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm sm:text-base">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (!form || !submission) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-12 sm:w-16 bg-gray-200 rounded-full px-2 py-1">
                <Link href="/">
                  <Image
                    src="/logo-bridgewell.png"
                    alt="Bridgewell Financial Logo"
                    width={60}
                    height={60}
                    className="cursor-pointer"
                  />
                </Link>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary mb-1">
                  Form Submission
                </h1>
                {error && (
                  <p className="text-red-500 text-sm sm:text-base">{error}</p>
                )}
              </div>
            </div>
            <Link
              href="/dashboard"
              className="bg-primary text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:bg-primary-DARK transition text-sm sm:text-base w-full sm:w-auto text-center"
            >
              Back to Dashboard
            </Link>
          </div>

          <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
            <svg
              className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400"
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
            <h2 className="mt-4 text-lg sm:text-xl font-medium text-gray-900">
              Submission not found
            </h2>
            <p className="mt-2 text-gray-500 text-sm sm:text-base">
              {error ||
                "The form submission you're looking for could not be found. It may have been deleted or never existed."}
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-3 sm:px-4 py-2 mr-3 bg-white border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <svg
                  className="-ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500"
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

  const responses = JSON.parse(submission.responses);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-12 sm:w-16 bg-gray-200 rounded-full px-2 py-1">
              <Link href="/">
                <Image
                  src="/logo-bridgewell.png"
                  alt="Bridgewell Financial Logo"
                  width={60}
                  height={60}
                  className="cursor-pointer"
                />
              </Link>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary mb-1">
                Form Submission
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Submitted on{" "}
                {new Date(submission.submitted_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="bg-primary text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:bg-primary-DARK transition text-sm sm:text-base w-full sm:w-auto text-center"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Client Information */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-primary mb-4">
            Client Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Client Name</p>
              <p className="font-medium text-sm sm:text-base">
                {form.client_name}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Organization</p>
              <p className="font-medium text-sm sm:text-base">
                {form.organization}
              </p>
            </div>
          </div>
        </div>

        {/* Responses */}
        <div className="space-y-4 sm:space-y-6">
          {Object.entries(responses).map(([index, response]) => {
            const responseData = response as ResponseData;
            return (
              <div
                key={index}
                className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm"
              >
                <div className="mb-3 sm:mb-4">
                  <span className="bg-primary text-white text-xs sm:text-sm py-1 px-2 sm:px-3 rounded-full">
                    Question {parseInt(index) + 1}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-medium mb-2">
                  {responseData.questionText}
                </h3>

                {responseData.responseType === "file" ? (
                  <div className="mt-2">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">
                      File Upload
                    </p>
                    {responseData.fileUrl ? (
                      <a
                        href={responseData.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-DARK flex items-center gap-2 text-sm sm:text-base"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
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
                        {responseData.fileName}
                      </a>
                    ) : (
                      <p className="text-gray-500 text-sm sm:text-base">
                        No file uploaded
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">
                      Text Response
                    </p>
                    <p className="bg-gray-50 p-3 sm:p-4 rounded-xl whitespace-pre-wrap text-sm sm:text-base">
                      {responseData.textResponse}
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
