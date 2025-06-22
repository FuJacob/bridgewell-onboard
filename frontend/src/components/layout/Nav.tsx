import React from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/app/utils/supabase/server";
import SignOutButton from "../ui/SignOutButton";
export async function Nav() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
  }

  return (
    <nav className="mx-4 sm:mx-8 md:mx-16 lg:mx-32 xl:mx-40 py-6 md:py-12 text-lg md:text-2xl font-bold flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 lg:gap-12">
      <Link href="/">
        <div className="w-24 sm:w-32 md:w-40">
          <Image
            src="/logo-bridgewell.png"
            alt="Bridgewell Financial Logo"
            width={100}
            height={100}
          />
        </div>
      </Link>
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-12 text-center">
        <a
          href="https://bridgewellfinancial.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          Go to Bridgewell Website
        </a>
      </div>
      <div>
        {error ? (
          <Link href="/login">
            <button className="flex justify-center font-semibold items-center gap-2 md:gap-4 bg-primary rounded-full text-white px-4 md:px-8 py-2 md:py-4 text-sm md:text-base">
              <div className="w-8 sm:w-16 md:w-32">
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
              <span className="hidden sm:inline">Admin Login</span>
              <span className="sm:hidden">Login</span>
            </button>
          </Link>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 md:gap-4 bg-primary rounded-3xl text-white px-6 md:px-8 py-4">
            <div className="flex items-center justify-center gap-2 md:gap-4">
              <div className="w-8 sm:w-16 md:w-32">
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
              <span className="text-sm md:text-base">Admin Panel</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 md:gap-6">
              <Link href="/dashboard">
                <button className="flex justify-center text-sm md:text-lg font-semibold items-center gap-2 md:gap-4 bg-secondary rounded-2xl text-white px-4 md:px-6 py-2">
                  Dashboard
                </button>
              </Link>
              <SignOutButton />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Nav;
