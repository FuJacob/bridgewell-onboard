import { NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";
import { TemplateInsert, TemplateQuestion } from "@/types";

// Configure route segment for large file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '0', // no explicit limit
    },
  },
};


export async function POST(request: Request) {
  try {
    console.log("save-template API called");

    // Check if this is FormData (with files) or JSON
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData with files
      const formData = await request.formData();
      const templateName = formData.get("templateName") as string;
      const questionsRaw = formData.get("questions") as string;

      console.log("Received FormData - templateName:", templateName);
      console.log("Questions raw:", questionsRaw);

      if (!templateName || !questionsRaw) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      const questions = JSON.parse(questionsRaw) as TemplateQuestion[];
      console.log("Parsed questions:", questions);

      // For templates: never keep or upload per-question template files
      const processedQuestions = questions.map((q: TemplateQuestion) => ({
        ...q,
        templates: null,
      }));

      // Save to database
      const supabase = createServiceClient();
      const templateInsertData: TemplateInsert = {
        template_name: templateName,
        questions: JSON.stringify(processedQuestions),
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
      const processed = (questions as TemplateQuestion[]).map((q) => ({
        ...q,
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
    }
  } catch (err) {
    console.error("Server error in save-template:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
