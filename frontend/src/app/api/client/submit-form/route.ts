import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        // Parse the multipart form data
        const formData = await request.formData();
        const loginKey = formData.get("loginKey") as string;
        const clientId = formData.get("clientId") as string;
        const clientName = formData.get("clientName") as string;
        
        // Parse the responses JSON
        const responsesJSON = formData.get("responses") as string;
        let responses;
        
        try {
            responses = JSON.parse(responsesJSON);
        } catch (error) {
            console.error("Error parsing responses JSON:", error);
            return NextResponse.json({ error: "Invalid responses data" }, { status: 400 });
        }
        
        // Process file uploads if present
        const fileResponses: { [key: string]: { url: string; filename: string } } = {};
        
        // Process each file in the form data
        for (const [key, value] of formData.entries()) {
            if (key.startsWith("file_") && value instanceof File) {
                const questionIndex = key.replace("file_", "");
                const filename = value.name;
                const fileBuffer = await value.arrayBuffer();
                
                // Upload file to Supabase Storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from("client-uploads")
                    .upload(`${clientId}/${loginKey}_${questionIndex}_${filename}`, fileBuffer, {
                        contentType: value.type,
                        upsert: true,
                    });
                
                if (uploadError) {
                    console.error("Error uploading file:", uploadError);
                    continue;
                }
                
                // Get public URL for the uploaded file
                const { data: publicUrlData } = supabase.storage
                    .from("client-uploads")
                    .getPublicUrl(uploadData.path);
                
                fileResponses[questionIndex] = {
                    url: publicUrlData.publicUrl,
                    filename,
                };
            }
        }
        
        // Update responses with file URLs
        for (const [index, fileData] of Object.entries(fileResponses)) {
            if (responses[index] && responses[index].responseType === "file") {
                responses[index].fileUrl = fileData.url;
            }
        }
        
        // Save the form submission in the database
        const { data, error } = await supabase
            .from("submissions")
            .insert([
                {
                    client_id: clientId,
                    client_name: clientName,
                    login_key: loginKey,
                    responses: JSON.stringify(responses),
                    submitted_at: new Date().toISOString(),
                },
            ]);
        
        if (error) {
            console.error("Error saving submission:", error);
            return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
        }
        
        return NextResponse.json({ success: true, message: "Form submitted successfully" });
        
    } catch (error) {
        console.error("Error in submit-form API:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// Increase the body size limit for file uploads
export const config = {
    api: {
        bodyParser: false,
    },
}; 