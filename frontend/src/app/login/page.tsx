"use client";
import React from "react";
import LoginForm from "@/components/forms/LoginForm";
import { login } from "./actions";

export default function SignIn() {
  return <LoginForm onSubmit={login} />;
}
