"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Landing = () => {
  const [loginKey, setLoginKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginKey.trim()) {
      setError('Please enter your login key');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate the key
      const response = await fetch(`/api/client/validate-key?key=${encodeURIComponent(loginKey)}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        // Redirect to the client form page with the key
        router.push(`/client/form/${loginKey}`);
      } else {
        setError(data.error || 'Invalid key. Please try again.');
      }
    } catch (err) {
      console.error('Error validating key:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-40 min-h-screen flex flex-row items-center justify-center">
      <div className="flex flex-col w-1/2">
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
          <span className="text-primary">Simplified</span> <span className='font-semibold'>&</span>{" "}
          <span className="text-secondary">Secure</span>
        </h1>
        <h2 className="w-2/3">
          MakeForms empowers teams to build advanced, visually stunning forms
          with top-notch security standards, now enhanced by AI capabilities.
        </h2>
        <div className="py-6 mt-12">
          <form onSubmit={handleSubmit} className="flex flex-col items-start gap-3">
            <div className="flex flex-row items-center gap-6">
              <input
                className="border-secondary border-2 text-4xl font-bold rounded-2xl text-center h-24 w-96"
                type="text"
                placeholder="Enter your code"
                value={loginKey}
                onChange={(e) => setLoginKey(e.target.value)}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-primary w-36 text-white text-2xl font-bold rounded-2xl py-8
                  ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-DARK'}`}
              >
                {isSubmitting ? 'Checking...' : 'Submit'}
              </button>
            </div>
            {error && (
              <div className="text-red-500 font-medium ml-2">{error}</div>
            )}
            <div className="flex items-center justify-between w-full mt-2">
              <Link 
                href={loginKey ? `/client?key=${encodeURIComponent(loginKey)}` : "/client"} 
                className="text-primary hover:underline ml-2"
              >
                Access client portal
              </Link>
              <Link href="/admin" className="text-primary hover:underline mr-2">
                Admin login
              </Link>
            </div>
          </form>
        </div>
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
            <div className="flex flex-row gap-4">
              <div className="bg-white rounded-2xl p-6 space-y-4 flex flex-col items-center text-center justify-center">
                <h1 className="text-5xl">😀</h1>
                <p>
                  Prospects get lost in complex follow-up emails full of links
                  and attachments.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 space-y-4 flex flex-col items-center text-center justify-center">
                <h1 className="text-5xl">😀</h1>
                <p>
                  Prospects get lost in complex follow-up emails full of links
                  and attachments.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 space-y-4 flex flex-col items-center text-center justify-center">
                <h1 className="text-5xl">😀</h1>
                <p>
                  Prospects get lost in complex follow-up emails full of links
                  and attachments.
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
