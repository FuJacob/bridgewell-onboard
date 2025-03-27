import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        // Get the login key from the URL
        const url = new URL(request.url);
        const key = url.searchParams.get("key");

        if (!key) {
            return NextResponse.json({ error: "Login key is required" }, { status: 400 });
        }

        // Fetch client data based on the login key
        const { data, error } = await supabase
            .from("clients")
            .select("id, client_name, organization, questions, login_key")
            .eq("login_key", key)
            .single();

        if (error || !data) {
            console.error("Error fetching form data:", error);
            return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        // Parse the questions JSON stored in the database
        let questions = [];
        try {
            questions = JSON.parse(data.questions);
        } catch (parseError) {
            console.error("Error parsing questions JSON:", parseError);
            questions = [];
        }

        // Format response to match ClientData type
        const response = {
            id: data.id,
            clientName: data.client_name,
            organization: data.organization,
            questions
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error in form-data API:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
} 