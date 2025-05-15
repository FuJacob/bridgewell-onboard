import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClientFolder, createQuestionFolders } from "@/app/utils/microsoft/graph";
import { v4 as uuidv4 } from "uuid";


export async function POST(request: Request) {
    try {
        console.log("Starting form creation process...");
        const { clientName, organization, questions } = await request.json();
        console.log("Received form data:", { clientName, organization, questionsCount: questions.length });
        
        // Initialize Supabase client with service role key
        console.log("Initializing Supabase client...");
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Missing Supabase environment variables");
        }
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        console.log("Supabase client initialized successfully");

        // Generate a unique login key
        const loginKey = uuidv4();
        console.log("Generated login key:", loginKey);

        // Store the form data in Supabase first
        console.log("Storing form data in Supabase...");
        const { data, error } = await supabase.from("clients").insert([
            {
                client_name: clientName,
                organization: organization,
                questions: JSON.stringify(questions),
                login_key: loginKey,
            },
        ]).select();

        if (error) {
            console.error("Supabase error creating form:", error);
            return NextResponse.json(
                { error: `Database error: ${error.message}` },
                { status: 500 }
            );
        }
        console.log("Form data stored successfully in Supabase");

        // Create the main client folder in OneDrive
        console.log("Creating OneDrive client folder...");
        try {
            await createClientFolder(loginKey, clientName);
            console.log("OneDrive client folder created successfully");

            // Create subfolders for each question
            console.log("Creating question folders in OneDrive...");
            await createQuestionFolders(loginKey, clientName, questions);
            console.log("Question folders created successfully");
        } catch (oneDriveError: any) {
            console.error("OneDrive folder creation failed:", oneDriveError);
            // Don't return error here, just log it since the form is already created
        }

        return NextResponse.json({ 
            message: "Form created successfully",
            loginKey
        });
    } catch (error) {
        console.error("Error in create-form:", error);
        return NextResponse.json(
            { error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}