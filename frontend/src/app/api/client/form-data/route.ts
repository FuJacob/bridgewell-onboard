import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Get the login key from the URL
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (!key) {
      console.log("No login key provided in request");
      return NextResponse.json(
        { error: "Login key is required" },
        { status: 400 }
      );
    }

    console.log("Attempting to fetch form data for login key:", key);
    // Use service client instead of regular client to avoid auth requirements
    const supabase = createServiceClient();

    // First, check if the login key exists
    const { data: existingData, error: checkError } = await supabase
      .from("clients")
      .select("login_key")
      .eq("login_key", key);

    if (checkError) {
      console.error("Error checking login key existence:", checkError);
      return NextResponse.json(
        { error: "Database error while checking login key" },
        { status: 500 }
      );
    }

    if (!existingData || existingData.length === 0) {
      console.log("No client found with login key:", key);
      return NextResponse.json({ error: "Invalid login key" }, { status: 404 });
    }

    // Fetch client data based on the login key
    console.log("Fetching full client data...");
    const { data, error } = await supabase
      .from("clients")
      .select("id, client_name, organization, questions, login_key")
      .eq("login_key", key)
      .single();

    if (error) {
      console.error("Error fetching client data:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      console.log("No data returned for login key:", key);
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    console.log("Successfully retrieved client data:", {
      id: data.id,
      clientName: data.client_name,
      hasQuestions: !!data.questions,
    });

    // Parse the questions JSON stored in the database
    let questions = [];
    try {
      questions = JSON.parse(data.questions);
      console.log("Successfully parsed questions, count:", questions.length);
    } catch (parseError) {
      console.error("Error parsing questions JSON:", parseError);
      console.log("Raw questions data:", data.questions);
      questions = [];
    }

    // Format response to match ClientData type
    const response = {
      id: data.id,
      clientName: data.client_name,
      organization: data.organization,
      questions,
      loginKey: data.login_key,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in form-data API:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
