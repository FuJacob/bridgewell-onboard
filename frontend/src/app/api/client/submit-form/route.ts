import { NextResponse } from "next/server";
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
      return NextResponse.json({ error: "Invalid login key" }, { status: 400 });
    }

    // Upload files to OneDrive
    const uploadedFiles = [];
    console.log(`Starting upload for ${files.length} files`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Uploading file ${i + 1}/${files.length}: ${file.name} (${file.size} bytes)`);
      
      try {
        const buffer = await file.arrayBuffer();
        const fileId = await uploadFileToClientFolder(
          loginKey,
          clientData.client_name || 'unknown_client',
          file.name,
          new Blob([buffer])
        );
        console.log(`Successfully uploaded file ${i + 1}: ${file.name} with ID: ${fileId}`);
        uploadedFiles.push({
          name: file.name,
          id: fileId,
        });
      } catch (error) {
        console.error(`Failed to upload file ${i + 1}: ${file.name}`, error);
        // Continue with other files but log the failure
      }
    }

    // Note: Submissions are tracked via SharePoint file existence, not database records
    console.log("Form submission tracked via uploaded files to SharePoint");
    console.log(`Uploaded ${uploadedFiles.length} files for form submission`);
    // In this system, form completion is determined by the presence of files
    // in SharePoint folders, not by database submission records.

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
