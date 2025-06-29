import { createServiceClient } from "@/app/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { loginKey } = await req.json();
    console.log("Updating last active time for login key:", loginKey);

    if (!loginKey) {
      return NextResponse.json(
        { error: "Login key is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const timestamp = new Date().toISOString();
    console.log("Timestamp to update:", timestamp);

    const { data, error } = await supabase
      .from("clients")
      .update({ last_active_at: timestamp })
      .eq("login_key", loginKey);

    if (error) {
      console.error("Supabase error details:", error);
      return NextResponse.json(
        { error: "Failed to update last active time", details: error.message },
        { status: 500 }
      );
    }

    console.log("Update successful, data:", data);
    return NextResponse.json(
      { message: "Last active time updated successfully", data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in update-last-active-at endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
