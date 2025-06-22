import React, { useState, ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { LoginFormData } from "@/types";

interface LoginFormProps {
  onSubmit: (formData: FormData) => void;
  loading?: boolean;
}

export default function LoginForm({
  onSubmit,
  loading = false,
}: LoginFormProps) {
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData();
    form.append("email", formData.email);
    form.append("password", formData.password);
    onSubmit(form);
  };

  return (
    <div className="flex justify-center items-center min-h-screen text-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-sm sm:max-w-md md:max-w-lg lg:w-96 min-h-80 md:h-96 p-6 sm:p-8 md:p-12 rounded-2xl flex gap-4 flex-col items-center justify-center shadow-lg"
      >
        <div className="mb-4">
          <Link href="/">
            <div className="w-24 sm:w-32 md:w-40 mx-auto mb-4">
              <Image
                src="/logo-bridgewell.png"
                alt="Bridgewell Financial Logo"
                width={100}
                height={100}
              />
            </div>
          </Link>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
            Admin Login
          </h2>
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
