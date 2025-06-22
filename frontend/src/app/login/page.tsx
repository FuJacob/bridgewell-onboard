"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useState, ChangeEvent } from "react";

import { login } from "./actions";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === "email") {
      setEmail(e.target.value);
    } else if (e.target.name === "password") {
      setPassword(e.target.value);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen text-center p-4">
      <form className="bg-white w-full max-w-sm sm:max-w-md md:max-w-lg lg:w-96 min-h-80 md:h-96 p-6 sm:p-8 md:p-12 rounded-2xl flex gap-4 flex-col items-center justify-center shadow-lg">
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

        <input
          name="email"
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={handleChange}
          required
          className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          id="password"
          value={password}
          onChange={handleChange}
          required
          className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
        />

        <input
          formAction={login}
          type="submit"
          className="bg-primary py-2 sm:py-3 px-4 sm:px-6 rounded-2xl text-white font-bold cursor-pointer hover:bg-primary-DARK transition-colors w-full mt-2 text-sm sm:text-base"
          value="Sign In"
        />
      </form>
    </div>
  );
};

export default SignIn;
