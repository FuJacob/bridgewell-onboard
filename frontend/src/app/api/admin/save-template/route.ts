import { NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";

export async function POST(request: Request) {
  try {
    console.log("save-template API called");
    const body = await request.json();
    console.log("Request body:", body);
    
    const { templateName, questions } = body;
    if (!templateName || !Array.isArray(questions)) {
      console.log("Invalid input - templateName:", templateName, "questions:", questions);
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    
    console.log("Template name:", templateName);
    console.log("Questions array length:", questions.length);
    console.log("Questions to store:", questions);
    
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("templates")
      .insert([
        {
          template_name: templateName,
          questions: JSON.stringify(questions), // store as text
        },
      ])
      .select();
      
    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log("Template saved successfully:", data);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Server error in save-template:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 