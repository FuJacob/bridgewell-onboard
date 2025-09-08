import { NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";
import { TemplateInsert, TemplateQuestion } from "@/types";

// Configure route segment for large file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};


export async function POST(request: Request) {
  try {
    console.log("save-template API called");

    // Check if this is FormData (with files) or JSON
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // Handle JSON request (existing behavior)
      const body = await request.json();
      console.log("Request body:", body);

      const { templateName, questions } = body;
      if (!templateName || !Array.isArray(questions)) {
        console.log(
          "Invalid input - templateName:",
          templateName,
          "questions:",
          questions
        );
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
      }

      console.log("Template name:", templateName);
      console.log("Questions array length:", questions.length);
      console.log("Questions to store:", questions);

      const supabase = createServiceClient();
      // Strip any file template metadata before storing
      const processed = (questions as TemplateQuestion[]).map((q, idx) => ({
        ...q,
        order: typeof (q as any).order === 'number' ? (q as any).order : idx + 1,
        templates: null,
      }));
      const templateInsertData: TemplateInsert = {
        template_name: templateName,
        questions: JSON.stringify(processed),
      };
      
      const { data, error } = await supabase
        .from("templates")
        .insert([templateInsertData])
        .select();

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log("Template saved successfully:", data);
      return NextResponse.json({ success: true, data });
    } else {
      // Fallback: treat any non-JSON request as invalid to avoid large body handling
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }
  } catch (err) {
    console.error("Server error in save-template:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
