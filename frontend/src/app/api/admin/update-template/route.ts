import { NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";
import { TemplateQuestion } from "@/types";

// Configure route segment for large file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '0', // no explicit limit
    },
  },
};


export async function PUT(request: Request) {
  try {
    console.log("update-template API called");

    // Check if this is FormData (with files) or JSON
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData with files (but we will not upload any files to OneDrive)
      const formData = await request.formData();
      const templateId = formData.get("templateId") as string;
      const templateName = formData.get("templateName") as string;
      const questionsRaw = formData.get("questions") as string;

      console.log("Received FormData - templateId:", templateId);
      console.log("Received FormData - templateName:", templateName);
      console.log("Questions raw:", questionsRaw);

      if (!templateId || !templateName || !questionsRaw) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      const questions = JSON.parse(questionsRaw) as TemplateQuestion[];
      console.log("Parsed questions:", questions);

      // For templates: do not keep or upload per-question template files
      const processedQuestions = questions.map((q: TemplateQuestion) => ({
        ...q,
        templates: null,
      }));

      // Update in database
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from("templates")
        .update({
          template_name: templateName,
          questions: JSON.stringify(processedQuestions),
        })
        .eq("id", parseInt(templateId, 10))
        .select();

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log("Template updated successfully:", data);
      return NextResponse.json({ success: true, data });
    } else {
      // Handle JSON request (existing behavior)
      const body = await request.json();
      console.log("Request body:", body);

      const { templateId, templateName, questions } = body;
      if (!templateId || !templateName || !Array.isArray(questions)) {
        console.log(
          "Invalid input - templateId:",
          templateId,
          "templateName:",
          templateName,
          "questions:",
          questions
        );
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
      }

      console.log("Template ID:", templateId);
      console.log("Template name:", templateName);
      console.log("Questions array length:", questions.length);
      console.log("Questions to store:", questions);

      const supabase = createServiceClient();
      // Strip any file template metadata before storing
      const processed = (questions as TemplateQuestion[]).map((q) => ({
        ...q,
        templates: null,
      }));
      const { data, error } = await supabase
        .from("templates")
        .update({
          template_name: templateName,
          questions: JSON.stringify(processed), // store as text without files
        })
        .eq("id", parseInt(templateId, 10))
        .select();

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log("Template updated successfully:", data);
      return NextResponse.json({ success: true, data });
    }
  } catch (err) {
    console.error("Server error in update-template:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
