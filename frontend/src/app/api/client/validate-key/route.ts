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
            return NextResponse.json({ valid: false, error: "Login key is required" }, { status: 400 });
        }

        // Check if the login key exists in the database
        const { data, error } = await supabase
            .from("clients")
            .select("id, client_name, organization")
            .eq("login_key", key)
            .single();

        if (error || !data) {
            console.error("Error validating key:", error);
            return NextResponse.json({ valid: false, error: "Invalid login key" }, { status: 404 });
        }

        // Key is valid, return success
        return NextResponse.json({
            valid: true,
            clientId: data.id,
            clientName: data.client_name,
            organization: data.organization
        });
    } catch (error) {
        console.error("Error in validate-key API:", error);
        return NextResponse.json({ valid: false, error: "Server error" }, { status: 500 });
    }
} 