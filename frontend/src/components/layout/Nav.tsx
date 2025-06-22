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
    <nav className="py-6 md:py-12 text-lg md:text-2xl font-bold flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 lg:gap-12">
      <Link href="/">
        <div className="w-24 sm:w-32 md:w-40">
          <Image
            src="/logo-bridgewell.png"
            alt="Bridgewell Financial Logo"
            width={200}
            height={200}
          />
        </div>
      </Link>
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
          <div className="flex items-center space-x-4 bg-primary rounded-3xl p-4 text-white text-sm">
            <span className="flex items-center gap-2">
              <Image
                src="/logo-bridgewell-white.png"
                alt="Bridgewell Logo"
                width={72}
                height={72}
                className="mt-0.5"
              />
              Admin Panel
            </span>
            <p className="font-light">|</p>
            {/* Actions */}
            <Link
              href="/dashboard"
              className="flex justify-center text-xs font-semibold items-center gap-1 bg-secondary rounded-2xl text-white px-2 py-1 hover:bg-secondary/80 transition-colors"
            >
              Dashboard
            </Link>
            <p className="font-light">|</p>
            <SignOutButton className="flex justify-center text-xs font-semibold items-center gap-1 bg-secondary rounded-2xl text-white px-2 py-1 hover:bg-secondary/80 transition-colors" />
          </div>
        )}
      </div>
    </nav>
  );
}

export default Nav;
