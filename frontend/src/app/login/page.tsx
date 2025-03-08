"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useState, FormEvent, ChangeEvent } from "react";

import { useRouter } from "next/navigation";
import { login } from "./actions";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === "email") {
      setEmail(e.target.value);
    } else if (e.target.name === "password") {
      setPassword(e.target.value);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen text-center">
      <form className="bg-white w-96 h-96 p-12 rounded-2xl flex gap-4 flex-col items-center justify-center shadow-lg">
        <div className="mb-4">
          <Link href="/">
            <div className="w-40 mx-auto mb-4">
              <Image
                src="/logo-bridgewell.png"
                alt="Bridgewell Financial Logo"
                width={100}
                height={100}
                layout="responsive"
              />
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-primary">Employee Login</h2>
        </div>

        <input
          name="email"
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          id="password"
          value={password}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <input
          formAction={login}
          type="submit"
          className="bg-primary py-3 px-6 rounded-2xl text-white font-bold cursor-pointer hover:bg-primary-DARK transition-colors w-full mt-2"
          value="Sign In"
        />
      </form>
    </div>
  );
};

export default SignIn;
