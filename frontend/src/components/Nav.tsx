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
        {error ? (
          <Link href="/login">
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
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 gap-4 bg-primary rounded-3xl text-white px-24 py-4">
            <div className="flex items-center justify-center gap-4">
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
              Admin Panel
            </div>

            <div className="flex gap-6">
              <Link href="/dashboard">
                <button className="flex justify-center text-lg font-semibold items-center gap-4 bg-secondary rounded-2xl text-white px-6 py-2">
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
