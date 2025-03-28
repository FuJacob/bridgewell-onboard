"use client";

import React, { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";

type FormData = {
  id: string;
  client_name: string;
  organization: string;
  login_key: string;
  created_at: string;
  questions: string;
};

type FormSubmission = {
  id: string;
  client_id: string;
  client_name: string;
  login_key: string;
  responses: string;
  submitted_at: string;
};

export default function Dashboard() {
  const [forms, setForms] = useState<FormData[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "completed">(
    "all"
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Fetch forms
        const { data: formsData, error: formsError } = await supabase
          .from("clients")
          .select("*")
          .order("created_at", { ascending: false });

        if (formsError) {
          console.error("Error fetching forms:", formsError);
          setError("Failed to load forms data");
          setForms([]);
        } else {
          setForms(formsData || []);
        }

        // Fetch submissions
        const { data: submissionsData, error: submissionsError } =
          await supabase
            .from("submissions")
            .select("*")
            .order("submitted_at", { ascending: false });

        if (submissionsError) {
          console.error("Error fetching submissions:", submissionsError);
          setError("Failed to load submissions data");
          setSubmissions([]);
        } else {
          setSubmissions(submissionsData || []);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
        setForms([]);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFormStatus = (form: FormData) => {
    const formSubmissions = submissions.filter(
      (s) => s.login_key === form.login_key
    );
    if (formSubmissions.length === 0) return "pending";
    return "completed";
  };

  const filteredForms = forms.filter((form) => {
    if (activeTab === "all") return true;
    return getFormStatus(form) === activeTab;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
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
              <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
              {error && (
                <p className="text-red-500 text-sm mt-1">
                  {error} - Showing available data
                </p>
              )}
            </div>
          </div>
          <Link
            href="/admin"
            className="bg-secondary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition"
          >
            Create New Form
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Total Forms
            </h3>
            <p className="text-4xl font-bold text-primary">{forms.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Pending Responses
            </h3>
            <p className="text-4xl font-bold text-secondary">
              {forms.filter((form) => getFormStatus(form) === "pending").length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Completed Forms
            </h3>
            <p className="text-4xl font-bold text-green-500">
              {
                forms.filter((form) => getFormStatus(form) === "completed")
                  .length
              }
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "all"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Forms
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "pending"
                ? "bg-secondary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "completed"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Forms List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {forms.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Organization
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Login Key
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredForms.map((form) => {
                    const status = getFormStatus(form);
                    const formSubmission = submissions.find(
                      (s) => s.login_key === form.login_key
                    );

                    return (
                      <tr key={form.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {form.client_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {form.organization}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-900">
                          {form.login_key}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(form.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {status === "completed" ? "Completed" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                // Copy login key to clipboard
                                navigator.clipboard.writeText(form.login_key);
                                alert("Login key copied to clipboard!");
                              }}
                              className="text-primary hover:text-primary-DARK"
                            >
                              Copy Key
                            </button>
                            {formSubmission && (
                              <Link
                                href={`/submissions/${form.login_key}`}
                                className="text-secondary hover:text-opacity-80"
                              >
                                View Response
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-16">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No forms available
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {error
                    ? "Could not retrieve forms data"
                    : "Get started by creating a new form for your clients"}
                </p>
                <div className="mt-6">
                  <Link
                    href="/admin"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-DARK focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Create New Form
                  </Link>
                </div>
              </div>
            )}
          </div>
          {filteredForms.length === 0 && forms.length > 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No forms match your current filter
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
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
              Retry Loading Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
