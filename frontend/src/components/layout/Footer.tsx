import React from "react";
import Link from "next/link";
import Image from "next/image";
const Footer = () => {
  return (
    <footer className="my-6 md:my-12 text-white rounded-3xl p-6 md:p-12 text-sm sm:text-base md:text-lg flex flex-col lg:flex-row bg-primary justify-between items-center gap-8 lg:gap-12">
      <div className="flex flex-col items-center lg:items-start space-y-4 md:space-y-6">
        <div className="flex items-center gap-4">
          <div>
            <Image
              src="/logo-bridgewell-white.png"
              alt="Bridgewell Financial Logo"
              width={256}
              height={256}
            />
            <p className="text-sm sm:text-base md:text-lg opacity-90 text-center lg:text-left">
              Secure Client Onboarding Portal
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm md:text-base opacity-75 text-center lg:text-left max-w-md">
          Streamlining your enrollment process with our secure client portal,
          designed to make document submission seamless and efficient.
        </p>
      </div>

      <div className="flex flex-col items-center space-y-6 md:space-y-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center">
          Need Assistance?
        </h2>
        <p className="text-sm sm:text-base md:text-lg opacity-90 text-center max-w-md leading-relaxed">
          Contact Bridgewell for help with your onboarding process. We&apos;re
          here to guide you through steps.
        </p>
        <Link
          href="mailto:support@bridgewell.com"
          className="bg-secondary hover:bg-opacity-90 rounded-full text-white px-6 sm:px-8 md:px-12 py-3 md:py-4 text-base sm:text-lg md:text-xl font-semibold text-center transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Email Support Team
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
