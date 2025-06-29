import { NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";
import { uploadFileToClientFolder } from "@/app/utils/microsoft/graph";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const loginKey = formData.get("loginKey") as string;
    const questionIndex = formData.get("questionIndex") as string;
    const questionText = formData.get("questionText") as string;
    const response_type = formData.get("response_type") as string;

    // Text response or file
    const textResponse = formData.get("textResponse") as string;
    const file = formData.get("file") as File | null;

    console.log("Processing question submission:", {
      loginKey,
      questionIndex,
      questionText,
      response_type,
      hasTextResponse: !!textResponse,
      hasFile: !!file,
    });

    // Use service client instead of regular client to avoid auth requirements
    const supabase = createServiceClient();

    // Get client information
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("login_key", loginKey)
      .single();

    if (clientError || !clientData) {
      console.error("Invalid login key:", loginKey, clientError);
      return NextResponse.json({ error: "Invalid login key" }, { status: 400 });
    }

    console.log("Client data retrieved:", {
      clientName: clientData.client_name,
    });

    const sanitizedQuestion = questionText
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    let fileId;

    try {
      if (response_type === "file" && file) {
        // Upload file
        const buffer = await file.arrayBuffer();
        const fileName = `${timestamp}_${file.name}`;
        fileId = await uploadFileToClientFolder(
          loginKey, // Use login key as the client ID for folder path
          clientData.client_name,
          `${sanitizedQuestion}/answer/${fileName}`,
          new Blob([buffer])
        );
        console.log("File uploaded successfully:", fileName);
      } else if (response_type === "text" && textResponse) {
        // Convert text response to file and upload
        const fileName = `response_${timestamp}.txt`;
        fileId = await uploadFileToClientFolder(
          loginKey, // Use login key as the client ID for folder path
          clientData.client_name,
          `${sanitizedQuestion}/answer/${fileName}`,
          new Blob([textResponse], { type: "text/plain" })
        );
        console.log("Text response uploaded as file:", fileName);
      } else {
        return NextResponse.json(
          { error: "No valid response provided" },
          { status: 400 }
        );
      }

      // Success - the file was uploaded to OneDrive
      return NextResponse.json({
        success: true,
        message: "Question response submitted successfully",
        fileId,
      });
    } catch (uploadError) {
      console.error("Error during file upload:", uploadError);
      return NextResponse.json(
        {
          error:
            uploadError instanceof Error
              ? uploadError.message
              : "Failed to upload response file",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in submit-question:", error);
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
