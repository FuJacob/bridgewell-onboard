"use client";
import React, { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ClientLoginForm from "@/components/forms/ClientLoginForm";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { validateClientKey } from "@/services/client";

export default function ClientForm() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading client portal..." />}>
      <ClientFormContent />
    </Suspense>
  );
}

// Separate component that uses useSearchParams
function ClientFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialKey, setInitialKey] = useState("");

  const handleSubmitWithKey = useCallback(
    async (key: string) => {
      try {
        setLoading(true);
        setError(null);

        // Validate the login key with our API
        await validateClientKey(key);

        // Store in localStorage for persistence
        localStorage.setItem("clientLoginKey", key);

        // Redirect to the form page
        router.push(`/client/form/${key}`);
      } catch (err) {
        console.error("Error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to validate login key"
        );
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    // Check for login key in localStorage
    const storedKey = localStorage.getItem("clientLoginKey");
    if (storedKey) {
      // If we already have a login key, redirect to the form page
      router.push(`/client/form/${storedKey}`);
      return;
    }

    // Check for login key in URL
    const key = searchParams.get("key");
    if (key) {
      setInitialKey(key);
      handleSubmitWithKey(key);
    }
  }, [searchParams, router, handleSubmitWithKey]);

  return (
    <ClientLoginForm
      onSubmit={handleSubmitWithKey}
      loading={loading}
      error={error}
      initialKey={initialKey}
    />
  );
}
