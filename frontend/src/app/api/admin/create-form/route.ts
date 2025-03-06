import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Get Supabase URL and anon key from environment variables
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
    try {
        // Parse the request body (form data)
        const { clientName, organization, questions } = await req.json();

        // Insert form data into the "forms" table (or create a new one if needed)
        const { data, error } = await supabase.from("forms").insert([
            {
                client_name: clientName,
                organization,
                questions: JSON.stringify(questions), // Save questions as a JSON array
            },
        ]);

        // Handle any errors that occur during the insert operation
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ message: "Form created successfully!", data });
    } catch (error) {
        console.error("Error occurred:", error); // Log the error
        return NextResponse.json({ error: "Something went wrong!" }, { status: 500 });
    }
}