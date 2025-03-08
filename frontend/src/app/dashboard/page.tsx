import React from "react";

import { redirect } from "next/navigation";
import { createClient } from "@/app/utils/supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/");
  }
  return <div>{data.user.email}</div>;
}
