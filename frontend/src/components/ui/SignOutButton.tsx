"use client";
import { signOut } from "../../app/login/actions";
export default function SignOutButton({ className }: { className?: string }) {
  return (
    <button onClick={signOut} className={className}>
      Sign Out
    </button>
  );
}
