import React from "react";
import Link from "next/link";
import Image from "next/image";
const Nav = () => {
  return (
    <nav className="mx-40 py-12 text-2xl font-bold space-x-12 flex justify-between items-center">
      <Link href="/">
        <div className="w-40">
          <Image
            src="/logo-bridgewell.png"
            alt="Bridgewell Financial Logo"
            width={100}
            height={100}
            layout="responsive"
          />
        </div>
      </Link>
      <div className="space-x-12 flex justify-between">
        <Link href="/">Tutorial</Link>
        <Link href="/">Contact</Link>
        <a
          href="https://bridgewellfinancial.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Go to Bridgewell Website
        </a>
      </div>
      <div>
        <Link href="/signin">
          <button className="flex justify-center font-semibold items-center gap-4 bg-primary rounded-full text-white px-8 py-4">
            <div className="w-32">
              <Image
                src="/logo-bridgewell-white.png"
                alt="Bridgewell Financial Logo"
                width={100}
                height={100}
                // Note: layout="responsive" is deprecated in Next.js 13+
                // Use style={{ width: '100%', height: 'auto' }} instead
                style={{ width: "100%", height: "auto" }}
              />
            </div>
            Employee Login
          </button>
        </Link>
      </div>
    </nav>
  );
};

export default Nav;
