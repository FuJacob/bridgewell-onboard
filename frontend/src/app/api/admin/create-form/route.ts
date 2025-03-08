import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { customAlphabet } from "nanoid"; // For generating random IDs

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create a custom alphabet for generating random IDs
const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 16);

export async function POST(req: Request) {
    try {
        // Parse the request body
        const body = await req.json();
        console.log("Request body:", body);

        // Destructure the data from the request body
        const { clientName, organization, questions } = body;

        // Generate a random 16-character ID
        const loginKey = nanoid(); // e.g., "A1B2C3D4E5F6G7H8"

        // Log the parsed data and generated ID for debugging
        console.log("Parsed data:", { clientName, organization, questions });
        console.log("Generated login key:", loginKey);

        // Insert the data into the Supabase table
        const { data, error } = await supabase
            .from("clients") // Ensure your table name is correct
            .insert([
                {
                    client_name: clientName,
                    organization: organization,
                    questions: JSON.stringify(questions),
                    login_key: loginKey, // Add the login key to the table
                },
            ])
            .select("login_key");

        console.log("Supabase response data:", data);

        // Handle Supabase errors
        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json(
                { error: "Failed to insert data into Supabase" },
                { status: 500 }
            );
        }

        // Return a success response with the login key
        return NextResponse.json(
            { message: "Client form generated successfully!", loginKey },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error in POST function:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
