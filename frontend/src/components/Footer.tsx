import React from "react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="my-12 text-white rounded-3xl mx-32 p-12 text-2xl font-bold flex flex-row bg-primary justify-between h-96 font-normal">
      <div className="flex flex-col items-start space-y-4 font-normal">
        <h3 className="text-3xl font-bold">Bridgewell Financial</h3>
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <Link href="/about" className="hover:underline">
          About Us
        </Link>
        <Link href="/services" className="hover:underline">
          Services
        </Link>
        <Link href="/client/portal" className="hover:underline">
          Client Portal
        </Link>
      </div>
      <div className="flex flex-col items-start space-y-4">
        <h3 className="text-3xl font-bold">Onboarding</h3>
        <Link href="/onboarding" className="hover:underline">
          Getting Started
        </Link>
        <Link href="/onboarding/documents" className="hover:underline">
          Document Submission
        </Link>
        <Link href="/onboarding/faq" className="hover:underline">
          FAQ
        </Link>
        <Link href="/onboarding/support" className="hover:underline">
          Support
        </Link>
      </div>
      <div className="flex flex-col items-start space-y-4">
        <h3 className="text-3xl font-bold">Legal & Security</h3>
        <Link href="/terms" className="hover:underline">
          Terms of Service
        </Link>
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
        <Link href="/security" className="hover:underline">
          Security
        </Link>
        <Link href="/compliance" className="hover:underline">
          Compliance
        </Link>
      </div>
      <div className="flex flex-col items-center justify-center gap-6">
        <h1 className="text-6xl font-bold">Need Assistance?</h1>
        <Link
          href="/contact"
          className="bg-secondary rounded-full text-white px-8 py-4"
        >
          Contact Bridgewell
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
