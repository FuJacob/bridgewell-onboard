import React from "react";
import Link from "next/link";
const Footer = () => {
  return (
    <footer className="my-12 text-white rounded-3xl mx-32 p-12 text-2xl font-bold space-x-12 flex flex-row bg-primary justify-between h-96">
      <div className="flex flex-col items-center justify-center">
        <a>Arrows Pricing</a> <a>Arrows Pricing</a> <a>Arrows Pricing</a>{" "}
        <a>Arrows Pricing</a>
      </div>

      <div className="flex flex-col items-center justify-center">
        <a>Arrows Pricing</a> <a>Arrows Pricing</a> <a>Arrows Pricing</a>{" "}
        <a>Arrows Pricing</a> <a>Arrows Pricing</a>
      </div>

      <div className="flex flex-col items-center justify-center">
        <a>Arrows Pricing</a>
        <a>Arrows Pricing</a>
        <a>Arrows Pricing</a>
        <a>Arrows Pricing</a>
      </div>
      <div className="flex flex-col items-center justify-center gap-6">
        <h1 className="text-6xl">Having issues?</h1>
        <Link
          href="/"
          className="bg-secondary rounded-full text-white px-8 py-4"
        >
          Contact Bridgewell
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
