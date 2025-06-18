import { NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";

export async function DELETE(request: Request) {
  try {
    console.log("delete-template API called");
    const { templateId } = await request.json();
    
    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }
    
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", templateId);
      
    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log("Template deleted successfully:", templateId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Server error in delete-template:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 