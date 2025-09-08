import { NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null as any);
    const { loginKey, question, mode, fileName, fileId } = body || {};

    if (!loginKey || !question || !mode || !fileName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    if (mode === "template") {
      // Append to templates array for matching question
      const { data: qs, error } = await supabase
        .from("questions")
        .select("id, templates")
        .eq("login_key", loginKey)
        .eq("question", question)
        .maybeSingle();
      if (error || !qs) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
      }
      let templates: Array<{ fileName: string; fileId: string; uploadedAt?: string }> = [];
      try {
        if (typeof qs.templates === 'string') templates = JSON.parse(qs.templates);
        else if (Array.isArray(qs.templates)) templates = qs.templates as any;
      } catch {}
      templates = Array.isArray(templates) ? templates : [];
      if (fileId && typeof fileId === 'string') {
        templates.push({ fileName, fileId, uploadedAt: new Date().toISOString() });
      }
      const { error: upErr } = await supabase
        .from("questions")
        .update({ templates: JSON.stringify(templates) })
        .eq("id", qs.id);
      if (upErr) {
        return NextResponse.json({ error: "Failed to update templates" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (mode === "answer") {
      // No DB metadata needed; completion checks look at OneDrive
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err) {
    console.error("finalize upload error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


