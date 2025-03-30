"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Landing = () => {
  const [loginKey, setLoginKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginKey.trim()) {
      setError("Please enter your login key");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Validate the key
      const response = await fetch(
        `/api/client/validate-key?key=${encodeURIComponent(loginKey)}`
      );
      const data = await response.json();

      if (response.ok && data.valid) {
        // Redirect to the client form page with the key
        router.push(`/client/form/${loginKey}`);
      } else {
        setError(data.error || "Invalid key. Please try again.");
      }
    } catch (err) {
      console.error("Error validating key:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-40 min-h-1/2 flex flex-row items-center justify-center">
      <div className="flex flex-row w-1/2">
        <div className="flex flex-col w-4/5">
          <div className="w-36 bg-gray-200 rounded-full px-4 py-2 mb-4">
            <Image
              src="/logo-bridgewell.png"
              alt="Bridgewell Financial Logo"
              width={100}
              height={100}
              layout="responsive"
            />
          </div>
          <h1 className="font-semibold text-6xl mb-2">Client Onboarding,</h1>
          <h1 className="font-bold text-6xl mb-8">
            <span className="text-primary">Simplified</span>{" "}
            <span className="font-semibold">&</span>{" "}
            <span className="text-secondary">Secure</span>
          </h1>
          <h2 className="text-2xl">
            Streamline your enrollment process with our secure client portal,
            designed to make document submission seamless and efficient.
          </h2>
          <h3 className="font-semibold text-primary bg-gray-200 rounded-3xl px-4 py-6 mt-24 mb-4">
            Begin by entering your private key given by your Bridgewell Advisor
            below
          </h3>{" "}
          <form
            onSubmit={handleSubmit}
            className="flex flex-row justify-between"
          >
            <input
              className="border-primary border-2 text-4xl font-bold text-center rounded-tl-2xl rounded-l-2xl xt-center h-24 w-2/3"
              type="text"
              placeholder="Enter your code"
              value={loginKey}
              onChange={(e) => setLoginKey(e.target.value)}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-primary w-36 text-white text-2xl font-bold rounded-tr-2xl rounded-r-2xl py-8 w-1/3
                    ${
                      isSubmitting
                        ? "opacity-70 cursor-not-allowed"
                        : "hover:bg-primary-DARK"
                    }`}
            >
              {isSubmitting ? "Checking..." : "Submit"}
            </button>

            {error && (
              <div className="text-red-500 font-medium ml-2">{error}</div>
            )}
          </form>
        </div>
        <div className="w-1/5" />
      </div>

      <div className="flex flex-col items-center justify-center w-1/2 gap-6 rounded-3xl">
        <video
          src="video-bridgewell.mp4"
          autoPlay
          muted
          className="w-full rounded-3xl border-8 border-secondary"
        ></video>

        <div className="flex flex-col text-center items-center justify-center space-y-12">
          <div className="">
            <h3 className="text-3xl font-semibold text-primary bg-gray-200 rounded-3xl px-4 py-6 mb-4">
              How the{" "}
              <span className="text-secondary">Client Onboarding Portal</span>{" "}
              works
            </h3>{" "}
            <div className="flex flex-row gap-4">
              <div className="bg-white rounded-2xl p-6 space-y-4 flex flex-col justify-center">
                <h1 className="text-3xl font-bold text-primary">Step 1</h1>
                <p>
                  Access your personal portal using your unique PIN. Our secure
                  authentication ensures your information remains confidential
                  and protected throughout the submission process.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 space-y-4 flex flex-col justify-center">
                <h1 className="text-3xl font-bold text-primary">Step 2</h1>
                <p>
                  Complete digital forms and upload required documents through
                  our intuitive interface. Save time with easy-to-follow prompts
                  and the ability to save your progress.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 space-y-4 flex flex-col justify-center">
                <h1 className="text-3xl font-bold text-primary">Step 3</h1>
                <p>
                  Your submissions are instantly received by the Bridgewell
                  team. No delays, no email attachments—just efficient
                  processing that gets you enrolled faster with confirmation of
                  receipt
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Landing;
