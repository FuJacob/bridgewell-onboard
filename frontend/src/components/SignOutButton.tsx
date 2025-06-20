"use client";
import { signOut } from "../app/login/actions";
export default function SignOutButton() {
  return (
    <button
      onClick={signOut}
      className="flex justify-center text-sm md:text-lg font-semibold items-center gap-2 md:gap-4 bg-secondary rounded-2xl text-white px-4 md:px-6 py-2"
    >
      Sign Out
    </button>
  );
}
