import { NextResponse } from "next/server";
import { createServiceClient, handleDatabaseError, withRetry } from "@/app/utils/supabase/server";
import { uploadFileToClientFolder, sanitizeSharePointName } from "@/app/utils/microsoft/graph";
import { validateLoginKey, validateQuestionText, type APIResponse } from "@/types";

interface SubmissionRequest {
  loginKey: string;
  questionIndex: string;
  questionText: string;
  response_type: string;
  textResponse?: string;
  file?: File;
}

export async function POST(request: Request): Promise<NextResponse<APIResponse<{ fileId: string }>>> {
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

    // Validate inputs
    if (!loginKey) {
      return NextResponse.json(
        { error: "Missing login key", success: false },
        { status: 400 }
      );
    }

    const loginKeyValidation = validateLoginKey(loginKey);
    if (!loginKeyValidation.isValid) {
      return NextResponse.json(
        { error: loginKeyValidation.errors.join(", "), success: false },
        { status: 400 }
      );
    }

    if (!questionText) {
      return NextResponse.json(
        { error: "Missing question text", success: false },
        { status: 400 }
      );
    }

    const questionValidation = validateQuestionText(questionText);
    if (!questionValidation.isValid) {
      return NextResponse.json(
        { error: questionValidation.errors.join(", "), success: false },
        { status: 400 }
      );
    }

    if (!response_type || !["text", "file"].includes(response_type)) {
      return NextResponse.json(
        { error: "Invalid response type", success: false },
        { status: 400 }
      );
    }

    // Use service client instead of regular client to avoid auth requirements
    const supabase = createServiceClient();

    // Get client information with retry logic
    const clientData = await withRetry(async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("login_key", loginKey)
        .maybeSingle();

      if (error) {
        const dbError = handleDatabaseError(error);
        throw new Error(`Database error: ${dbError.message}`);
      }

      if (!data) {
        throw new Error("Invalid login key");
      }

      return data;
    });

    console.log("Client data retrieved:", {
      clientName: clientData.client_name,
    });

    const sanitizedQuestion = sanitizeSharePointName(questionText);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    // Validate response data
    if (response_type === "file" && !file) {
      return NextResponse.json(
        { error: "File is required for file response type", success: false },
        { status: 400 }
      );
    }

    if (response_type === "text" && (!textResponse || textResponse.trim().length === 0)) {
      return NextResponse.json(
        { error: "Text response is required for text response type", success: false },
        { status: 400 }
      );
    }

    // Validate file if provided
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        return NextResponse.json(
          { error: "File size must be less than 50MB", success: false },
          { status: 400 }
        );
      }
      
      // Basic file type validation
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "File type not allowed", success: false },
          { status: 400 }
        );
      }
    }

    let fileId: string;

    try {
      if (response_type === "file" && file) {
        // Upload file
        const buffer = await file.arrayBuffer();
        const fileName = `${timestamp}_${file.name}`;
        fileId = await uploadFileToClientFolder(
          loginKey,
          clientData.client_name || 'unknown_client',
          `${sanitizedQuestion}/answer/${fileName}`,
          new Blob([buffer], { type: file.type })
        );
        console.log("File uploaded successfully:", fileName);
      } else if (response_type === "text" && textResponse) {
        // Convert text response to file and upload
        const fileName = `response_${timestamp}.txt`;
        fileId = await uploadFileToClientFolder(
          loginKey,
          clientData.client_name || 'unknown_client',
          `${sanitizedQuestion}/answer/${fileName}`,
          new Blob([textResponse], { type: "text/plain" })
        );
        console.log("Text response uploaded as file:", fileName);
      } else {
        return NextResponse.json(
          { error: "No valid response provided", success: false },
          { status: 400 }
        );
      }

      // Success - the file was uploaded to OneDrive
      return NextResponse.json({
        data: { fileId },
        success: true
      });

    } catch (uploadError) {
      console.error("Error during file upload:", uploadError);
      const errorMessage = uploadError instanceof Error 
        ? uploadError.message 
        : "Failed to upload response file";
      
      return NextResponse.json(
        { error: errorMessage, success: false },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error in submit-question:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    let statusCode = 500;
    
    if (errorMessage.includes("Invalid login key")) {
      statusCode = 404;
    } else if (errorMessage.includes("Database error")) {
      statusCode = 503;
    }

    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: statusCode }
    );
  }
}

// Increase the body size limit for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
