"use client";
import { FaSignOutAlt } from "react-icons/fa";
import { signOut } from "../../app/login/actions";
export default function SignOutButton({ className }: { className?: string }) {
  return (
    <button onClick={signOut} className={className}>
      <FaSignOutAlt />
      Sign Out
    </button>
  );
}
