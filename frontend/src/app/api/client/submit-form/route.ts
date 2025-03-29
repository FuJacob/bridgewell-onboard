import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { uploadFileToClientFolder } from "@/app/utils/microsoft/graph";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const loginKey = formData.get("loginKey") as string;
        const responses = formData.get("responses") as string;
        const files = formData.getAll("files") as File[];

        const supabase = await createClient();

        // Get client information
        const { data: clientData, error: clientError } = await supabase
            .from("clients")
            .select("*")
            .eq("login_key", loginKey)
            .single();

        if (clientError || !clientData) {
            return NextResponse.json(
                { error: "Invalid login key" },
                { status: 400 }
            );
        }

        // Upload files to OneDrive
        const uploadedFiles = [];
        for (const file of files) {
            const buffer = await file.arrayBuffer();
            const fileId = await uploadFileToClientFolder(
                clientData.client_id,
                clientData.client_name,
                file.name,
                new Blob([buffer])
            );
            uploadedFiles.push({
                name: file.name,
                id: fileId,
            });
        }

        // Store submission in Supabase
        const { error: submissionError } = await supabase.from("submissions").insert([
            {
                client_id: clientData.client_id,
                client_name: clientData.client_name,
                login_key: loginKey,
                responses: responses,
                files: uploadedFiles,
            },
        ]);

        if (submissionError) {
            console.error("Error storing submission:", submissionError);
            return NextResponse.json(
                { error: "Failed to store submission" },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: "Form submitted successfully" });
    } catch (error) {
        console.error("Error in submit-form:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Increase the body size limit for file uploads
export const config = {
    api: {
        bodyParser: false,
    },
}; 