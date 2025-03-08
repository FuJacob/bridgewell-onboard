"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useState, FormEvent, ChangeEvent } from "react";

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission
    try {
      const response = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Handle successful response
        console.log(response.json());
        // Redirect or show success message
      } else {
        // Handle error response
        console.error("Login failed");
        // Show error message
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen text-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-96 h-96 p-12 rounded-2xl flex gap-4 flex-col items-center justify-center shadow-lg"
      >
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
          type="text"
          name="email"
          placeholder="Username or Email"
          value={email}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={password}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <input
          type="submit"
          className="bg-primary py-3 px-6 rounded-2xl text-white font-bold cursor-pointer hover:bg-primary-DARK transition-colors w-full mt-2"
          value="Sign In"
        />
      </form>
    </div>
  );
};

export default SignIn;
