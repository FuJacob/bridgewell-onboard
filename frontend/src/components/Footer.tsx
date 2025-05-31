import React from "react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="my-6 md:my-12 text-white rounded-3xl mx-4 sm:mx-8 md:mx-16 lg:mx-32 p-6 md:p-12 text-sm sm:text-base md:text-lg lg:text-2xl flex flex-col lg:flex-row bg-primary justify-between gap-6 lg:gap-0 min-h-64 lg:h-96">
      <div className="flex flex-col items-start space-y-2 md:space-y-4">
        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">Bridgewell Financial</h3>
        <Link href="/" className="hover:underline text-sm sm:text-base md:text-lg lg:text-xl">
          Home
        </Link>
        <Link href="/about" className="hover:underline text-sm sm:text-base md:text-lg lg:text-xl">
          About Us
        </Link>
        <Link href="/services" className="hover:underline text-sm sm:text-base md:text-lg lg:text-xl">
          Services
        </Link>
        <Link href="/client/portal" className="hover:underline text-sm sm:text-base md:text-lg lg:text-xl">
          Client Portal
        </Link>
      </div>
      <div className="flex flex-col items-start space-y-2 md:space-y-4">
        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">Onboarding</h3>
        <Link href="/onboarding" className="hover:underline text-sm sm:text-base md:text-lg lg:text-xl">
          Getting Started
        </Link>
        <Link href="/onboarding/documents" className="hover:underline text-sm sm:text-base md:text-lg lg:text-xl">
          Document Submission
        </Link>
        <Link href="/onboarding/faq" className="hover:underline text-sm sm:text-base md:text-lg lg:text-xl">
          FAQ
        </Link>
        <Link href="/onboarding/support" className="hover:underline text-sm sm:text-base md:text-lg lg:text-xl">
          Support
        </Link>
      </div>
      <div className="flex flex-col items-start space-y-2 md:space-y-4">
        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">Legal & Security</h3>
        <Link href="/terms" className="hover:underline text-sm sm:text-base md:text-lg lg:text-xl">
          Terms of Service
        </Link>
        <Link href="/privacy" className="hover:underline text-sm sm:text-base md:text-lg lg:text-xl">
          Privacy Policy
        </Link>
        <Link href="/security" className="hover:underline text-sm sm:text-base md:text-lg lg:text-xl">
          Security
        </Link>
        <Link href="/compliance" className="hover:underline text-sm sm:text-base md:text-lg lg:text-xl">
          Compliance
        </Link>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 md:gap-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-center">Need Assistance?</h1>
        <Link
          href="/contact"
          className="bg-secondary rounded-full text-white px-4 sm:px-6 md:px-8 py-2 md:py-4 text-sm sm:text-base md:text-lg"
        >
          Contact Bridgewell
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
