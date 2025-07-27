import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, handleDatabaseError, withRetry } from "@/app/utils/supabase/server";
import { validateLoginKey, type ClientData, type APIResponse } from "@/types";

export async function GET(request: NextRequest): Promise<NextResponse<APIResponse<ClientData>>> {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Missing login key", success: false },
        { status: 400 }
      );
    }

    // Validate login key format
    const validation = validateLoginKey(key);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(", "), success: false },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Validate login key exists and get client data with retry logic
    const result = await withRetry(async () => {
      // First verify the key exists
      const { data: existing, error: keyError } = await supabase
        .from("clients")
        .select("login_key")
        .eq("login_key", key)
        .maybeSingle();

      if (keyError) {
        const dbError = handleDatabaseError(keyError);
        throw new Error(`Key validation failed: ${dbError.message}`);
      }

      if (!existing) {
        throw new Error("Invalid login key");
      }

      // Get client data
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("login_key", key)
        .single();

      if (clientError) {
        const dbError = handleDatabaseError(clientError);
        throw new Error(`Failed to fetch client data: ${dbError.message}`);
      }

      // Get questions data
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("login_key", key)
        .order("created_at", { ascending: true });

      if (questionsError) {
        const dbError = handleDatabaseError(questionsError);
        throw new Error(`Failed to fetch questions data: ${dbError.message}`);
      }

      return {
        client: clientData,
        questions: questionsData || []
      };
    });

    const responseData: ClientData = {
      ...result.client,
      questions: result.questions
    };

    return NextResponse.json({
      data: responseData,
      success: true
    });

  } catch (error) {
    console.error("Error in form-data API:", error);

    const errorMessage = error instanceof Error ? error.message : "Unexpected server error";
    
    // Return appropriate status code based on error type
    let statusCode = 500;
    if (errorMessage.includes("Invalid login key")) {
      statusCode = 404;
    } else if (errorMessage.includes("validation failed")) {
      statusCode = 400;
    }

    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: statusCode }
    );
  }
}
