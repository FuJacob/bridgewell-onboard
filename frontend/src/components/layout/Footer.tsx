import React from "react";
import Image from "next/image";
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
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
        <p className="text-sm sm:text-base md:text-lg opacity-90 max-w-md leading-relaxed">
          <span className="font-bold text-center">Need Assistance?</span>{" "}
          Contact us for help. We&apos;re here to guide you through our
          onboarding portal.
        </p>
        <div className="space-y-1 text-center lg:text-left w-full bg-white rounded-3xl p-4 text-primary font-light">
          <p className="flex items-center text-sm">
            <FaEnvelope className="mr-2" />
            <strong className="mr-2">Email:</strong>{" "}
            inquiries@bridgewellfinancial.com
          </p>
          <p className="flex items-center text-sm">
            <FaPhone className="mr-2" />
            <strong className="mr-2">Phone:</strong> (416) 479-4401
          </p>
          <p className="flex items-center text-sm">
            <FaMapMarkerAlt className="mr-2" />
            <strong className="mr-2">Mail:</strong> 33 Hillsdale Ave West,
            Toronto, ON; M5P 1E9
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
