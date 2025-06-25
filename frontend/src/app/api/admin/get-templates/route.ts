import { NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";

export async function GET() {
  try {
    console.log("get-templates API called");
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Map database column names to frontend interface
    const mappedTemplates = data?.map(template => ({
      id: template.id,
      name: template.template_name, // Map template_name to name
      questions: template.questions,
      created_at: template.created_at
    })) || [];
    
    console.log("Templates fetched successfully:", mappedTemplates);
    return NextResponse.json({ success: true, templates: mappedTemplates });
  } catch (err) {
    console.error("Server error in get-templates:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 