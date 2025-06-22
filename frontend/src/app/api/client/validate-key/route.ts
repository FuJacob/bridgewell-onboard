import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Get the login key from the URL
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { valid: false, error: "Login key is required" },
        { status: 400 }
      );
    }

    console.log("Validating login key:", key);
    // Use service client instead of regular client to avoid auth requirements
    const supabase = createServiceClient();

    // Check if the login key exists in the database
    const { data, error } = await supabase
      .from("clients")
      .select("id, client_name, organization")
      .eq("login_key", key)
      .single();

    if (error || !data) {
      console.error("Error validating key:", error);
      return NextResponse.json(
        { valid: false, error: "Invalid login key" },
        { status: 404 }
      );
    }

    // Key is valid, return success
    return NextResponse.json({
      valid: true,
      clientId: data.id,
      clientName: data.client_name,
      organization: data.organization,
    });
  } catch (error) {
    console.error("Error in validate-key API:", error);
    return NextResponse.json(
      { valid: false, error: "Server error" },
      { status: 500 }
    );
  }
}
