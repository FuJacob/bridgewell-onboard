import React from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/app/utils/supabase/server";
import SignOutButton from "./SignOutButton";

export async function Nav() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
  }
  return (
    <nav className="px-6 md:px-12 lg:px-20 py-6 text-lg font-medium sticky top-0 bg-white/90 backdrop-blur-md z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <div className="w-40 transition-transform hover:scale-105">
            <Image
              src="/logo-bridgewell.png"
              alt="Bridgewell Financial Logo"
              width={100}
              height={40}
              style={{ width: "100%", height: "auto" }}
              priority
            />
          </div>
        </Link>
        
        <div className="hidden md:flex space-x-8 items-center">
          <Link href="/" className="hover:text-primary transition-colors">Tutorial</Link>
          <Link href="/" className="hover:text-primary transition-colors">Contact</Link>
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
              <button className="flex justify-center font-semibold items-center gap-3 bg-primary hover:bg-primary-DARK transition-colors rounded-full text-white px-6 py-3">
                <div className="w-8 mr-1">
                  <Image
                    src="/logo-bridgewell-white.png"
                    alt="Bridgewell Financial Logo"
                    width={32}
                    height={32}
                    style={{ width: "100%", height: "auto" }}
                  />
                </div>
                Employee Login
              </button>
            </Link>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 bg-primary rounded-2xl text-white px-6 py-3 shadow-lg">
              <div className="flex items-center justify-center gap-3">
                <div className="w-8">
                  <Image
                    src="/logo-bridgewell-white.png"
                    alt="Bridgewell Financial Logo"
                    width={32}
                    height={32}
                    style={{ width: "100%", height: "auto" }}
                  />
                </div>
                <span className="font-semibold">Admin Panel</span>
              </div>

              <div className="flex gap-4">
                <Link href="/dashboard">
                  <button className="flex justify-center text-sm font-semibold items-center gap-2 bg-secondary hover:bg-opacity-80 transition-colors rounded-xl text-white px-4 py-2">
                    Dashboard
                  </button>
                </Link>
                <SignOutButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Nav;
