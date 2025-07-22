"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/app/utils/supabase/server";
import { Client } from "@/types";

export async function getAllForms(): Promise<Client[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.from("clients").select("*");
    console.log(data);
    if (error) {
      console.log(error);
      return [];
    }
    return data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function login(formData: FormData): Promise<{ status: string }> {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { status: "Invalid email or password" };
  }
  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function signup(formData: FormData): Promise<void> {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
}
