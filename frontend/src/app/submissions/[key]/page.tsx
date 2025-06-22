"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/app/utils/supabase/client";
import { FormData, FormSubmission, ResponseData } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import SubmissionResponseCard from "@/components/pages/SubmissionResponseCard";

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
    return <LoadingSpinner message="Loading submission..." />;
  }

  if (!form || !submission) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title="Form Submission"
            showBackButton
            backButtonText="Back to Dashboard"
            backButtonHref="/dashboard"
          />

          <EmptyState
            title="Submission not found"
            description={
              error ||
              "The form submission you're looking for could not be found. It may have been deleted or never existed."
            }
            secondaryActionLabel="Retry"
            onSecondaryAction={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  const responses = JSON.parse(submission.responses);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Form Submission"
          subtitle={`Submitted on ${new Date(
            submission.submitted_at
          ).toLocaleDateString()}`}
          showBackButton
          backButtonText="Back to Dashboard"
          backButtonHref="/dashboard"
        />

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
          {Object.entries(responses).map(([index, response]) => (
            <SubmissionResponseCard
              key={index}
              response={response as ResponseData}
              index={parseInt(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
