import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Input from "../ui/Input";
import Button from "../ui/Button";
import ErrorMessage from "../shared/ErrorMessage";

interface ClientLoginFormProps {
  onSubmit: (loginKey: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  initialKey?: string;
}

export default function ClientLoginForm({
  onSubmit,
  loading = false,
  error,
  initialKey = "",
}: ClientLoginFormProps) {
  const [loginKey, setLoginKey] = useState(initialKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginKey.trim()) return;
    await onSubmit(loginKey.trim());
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-6 md:mb-8">
          <div className="w-16 sm:w-20 md:w-24 bg-gray-200 rounded-full px-2 sm:px-3 md:px-4 py-1 md:py-2">
            <Link href="/">
              <Image
                src="/logo-bridgewell.png"
                alt="Bridgewell Financial Logo"
                width={80}
                height={80}
                className="cursor-pointer"
              />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg max-w-full sm:max-w-md mx-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-4 md:mb-6 text-center">
            Client Portal
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <Input
              label="Login Key"
              type="text"
              value={loginKey}
              onChange={(e) => setLoginKey(e.target.value)}
              placeholder="Enter your login key"
              required
            />

            {error && <ErrorMessage message={error} />}

            <Button
              type="submit"
              loading={loading}
              disabled={!loginKey.trim()}
              className="w-full"
            >
              Access Form
            </Button>
          </form>

          <div className="mt-4 md:mt-6 text-center">
            <Link
              href="/"
              className="text-primary hover:underline text-sm sm:text-base"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
