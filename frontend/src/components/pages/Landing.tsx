"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaInfoCircle } from "react-icons/fa";
import { validateClientKey } from "@/services/client";

const PROCESS_STEPS = [
  {
    number: 1,
    text: "Enter your PIN to access your personalized onboarding dashboard.",
  },
  {
    number: 2,
    text: "Fill out forms, upload documents, and track progress in real time.",
  },
  {
    number: 3,
    text: "Submit your documents instantly—no emails or delays.",
  },
];

const ProcessStep = ({ number, text }: { number: number; text: string }) => (
  <li className="bg-white rounded-2xl p-2 md:p-3 flex gap-4 items-center w-full">
    <div className="font-bold text-white bg-primary rounded-full w-10 h-10  flex items-center justify-center flex-shrink-0">
      {number}
    </div>
    <p className="text-xs sm:text-sm text-left">{text}</p>
  </li>
);

const Landing = () => {
  const [loginKey, setLoginKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginKey.trim()) {
      setError("Please enter your access code");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await validateClientKey(loginKey.trim());
      router.push(`/client/form/${loginKey.trim()}`);
    } catch (err) {
      console.error("Error validating key:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Invalid access code. Please check with your advisor."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-1/2 flex flex-col lg:flex-row items-center justify-center gap-8">
      {/* Left Section - Form */}
      <header className="flex flex-col w-full lg:w-1/2 max-w-2xl space-y-6">
        {/* Logo */}
        <div className="w-24 sm:w-32 md:w-36 bg-gray-200 rounded-full px-4 py-2">
          <Image
            src="/logo-bridgewell.png"
            alt="Bridgewell Financial Logo"
            width={100}
            height={100}
            className="w-full h-auto"
          />
        </div>

        {/* Headlines */}
        <div className="space-y-2">
          <h1 className="font-semibold text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
            Welcome,
          </h1>
          <p className="text-secondary font-semibold text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl py-2">
            Bridgewell Client
          </p>
          <h2 className="font-bold sm:text-xl md:text-2xl lg:text-3xl">
            <span className="text-primary">A Secure Portal Just for You</span>
          </h2>
        </div>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed">
          We’re excited to help you get started with Bridgewell. This secure
          portal is your personalized space to complete the onboarding process
          quickly, easily, and confidentially.
        </p>

        {/* Instructions */}
        <aside className="flex items-center bg-green-600/10 border-l-4 border-green-600 rounded-lg p-4 mt-8 md:mt-16 gap-2">
          <FaInfoCircle
            className="text-green-600 text-4xl"
            aria-hidden="true"
          />
          <p className="ml-3 text-green-600 font-medium">
            You should have received your private access key from your
            Bridgewell advisor via email. Enter it below to begin.
          </p>
        </aside>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <label htmlFor="access-code" className="sr-only">
                Access Code
              </label>
              <input
                id="access-code"
                className="w-full px-2 pb-2 border-b-2 border-gray-300 bg-transparent text-base sm:text-lg font-medium placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                type="text"
                placeholder="Enter your code"
                value={loginKey}
                onChange={(e) => {
                  setLoginKey(e.target.value);
                  setError("");
                }}
                disabled={isSubmitting}
              />

              <button
                type="submit"
                disabled={isSubmitting || !loginKey.trim()}
                className="mt-4 sm:mt-0 sm:ml-4 px-6 py-3 bg-primary text-white font-semibold rounded-full shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Checking..." : "Submit"}
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Need Assistance? Feel free to contact your advisor anytime.
            </p>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 rounded-lg p-3">
              {error}
            </div>
          )}
        </form>
      </header>

      {/* Right Section - Video & Process */}
      <section className="flex flex-col items-center w-full lg:w-1/2 max-w-2xl space-y-8">
        {/* Video */}
        <video
          src="video-bridgewell.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full rounded-3xl border-4 md:border-8 border-secondary shadow-lg"
          aria-label="Bridgewell onboarding process demonstration"
        />

        {/* Process Steps */}
        <section aria-labelledby="process-heading" className="w-full">
          <h2
            id="process-heading"
            className="sm:text-lg md:text-lg lg:text-xl font-semibold bg-white text-primary p-4 rounded-3xl text-center mb-4"
          >
            How Our New Client Onboarding Portal Works
          </h2>
          <ol className="flex flex-col gap-3 list-none">
            {PROCESS_STEPS.map((step) => (
              <ProcessStep
                key={step.number}
                number={step.number}
                text={step.text}
              />
            ))}
          </ol>
        </section>
      </section>
    </main>
  );
};

export default Landing;
