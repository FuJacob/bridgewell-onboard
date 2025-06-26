import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing login key" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: existing, error: keyError } = await supabase
      .from("clients")
      .select("login_key")
      .eq("login_key", key);

    if (keyError || !existing || existing.length === 0) {
      return NextResponse.json({ error: "Invalid login key" }, { status: 404 });
    }

    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("login_key", key)
      .single();

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: "Failed to fetch client data" },
        { status: 500 }
      );
    }

    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("login_key", key);

    if (questionsError || !questionsData) {
      return NextResponse.json(
        { error: "Failed to fetch questions data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: clientData.id,
      clientName: clientData.client_name,
      organization: clientData.organization,
      loginKey: clientData.login_key,
      questions: questionsData,
    });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
