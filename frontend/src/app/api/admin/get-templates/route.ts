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
    
    console.log("Templates fetched successfully:", data);
    return NextResponse.json({ success: true, templates: data });
  } catch (err) {
    console.error("Server error in get-templates:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 