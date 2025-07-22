"use client";
import React, { useState, ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { LoginFormData } from "@/types";
import { FaInfoCircle } from "react-icons/fa";

interface LoginFormProps {
  onSubmit: (formData: FormData) => Promise<{ status: string } | void>;
  loading?: boolean;
}

export default function LoginForm({
  onSubmit,
  loading = false,
}: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData();
    form.append("email", formData.email);
    form.append("password", formData.password);
    try {
      const result = await onSubmit(form);
      
      if (result && result.status) {
        setError(result.status);
      }
    } catch (_error) {
      // Redirect throws in Next.js server actions - this is expected for successful login
      // If we reach here with no error status set, it means login was successful
      console.log("Login action completed (likely successful redirect)");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 inset-0 fixed">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-md p-6 sm:p-8 md:p-10 rounded-2xl flex flex-col gap-6 justify-center shadow-xl"
        onFocus={() => setError(null)}
      >
        <div className="flex flex-col gap-4 items-center">
          <div className="flex gap-2 items-center justify-center">
            <Link href="/">
              <Image
                src="/logo-bridgewell.png"
                alt="Bridgewell Financial Logo"
                width={100}
                height={100}
              />
            </Link>
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-primary">
              Admin Login
            </h2>
          </div>
          {error && (
            <aside className="flex items-center bg-secondary/10 border-l-4 border-secondary rounded-lg px-4 py-2 text-sm w-full gap-2">
              <FaInfoCircle className="text-secondary" aria-hidden="true" />
              <p className="text-secondary font-medium">{error}</p>
            </aside>
          )}
        </div>

        <Input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <Input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <Button type="submit" loading={loading} className="w-full mt-2">
          Sign In
        </Button>
      </form>
    </div>
  );
}
