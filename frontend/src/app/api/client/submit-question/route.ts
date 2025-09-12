import { NextResponse } from "next/server";
import { createServiceClient, handleDatabaseError, withRetry } from "@/app/utils/supabase/server";
import { uploadFileToClientFolder, sanitizeSharePointName } from "@/app/utils/microsoft/graph";
import { validateLoginKey, validateQuestionText, type APIResponse } from "@/types";
import { getAccessToken } from "@/app/utils/microsoft/auth";

interface SubmissionRequest {
  loginKey: string;
  questionIndex: string;
  questionText: string;
  response_type: string;
  textResponse?: string;
  file?: File;
}

export async function POST(request: Request): Promise<NextResponse<APIResponse<{ fileIds: string[] }>>> {
  try {
    const formData = await request.formData();
    const loginKey = formData.get("loginKey") as string;
    const questionIndex = formData.get("questionIndex") as string;
    const questionText = formData.get("questionText") as string;
    const response_type = formData.get("response_type") as string;

    // Text response or files
    const textResponse = formData.get("textResponse") as string;
    let files = formData.getAll("files") as File[];
    // Backward compatibility: accept single 'file' field if present
    if ((!files || files.length === 0)) {
      const single = formData.get("file") as File | null;
      if (single) files = [single];
    }

    console.log("Processing question submission:", {
      loginKey,
      questionIndex,
      questionText,
      response_type,
      hasTextResponse: !!textResponse,
      hasFiles: files && files.length > 0,
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

    if (!response_type || !["text", "file", "notice"].includes(response_type)) {
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
    if (response_type === "file" && (!files || files.length === 0)) {
      return NextResponse.json(
        { error: "At least one file is required for file response type", success: false },
        { status: 400 }
      );
    }

    if (response_type === "text" && (!textResponse || textResponse.trim().length === 0)) {
      return NextResponse.json(
        { error: "Text response is required for text response type", success: false },
        { status: 400 }
      );
    }

    // No server-side file size/type validation

    const fileIds: string[] = [];

    try {
      if (response_type === "file" && files && files.length > 0) {
        for (const file of files) {
          const buffer = await file.arrayBuffer();
          const fileName = `${timestamp}_${file.name}`;
          const fileId = await uploadFileToClientFolder(
            loginKey,
            clientData.client_name || 'unknown_client',
            `${sanitizedQuestion}/answer/${fileName}`,
            new Blob([buffer], { type: file.type })
          );
          fileIds.push(fileId);
          console.log("File uploaded successfully:", fileName);
        }
      } else if (response_type === "text" && textResponse) {
        // Convert text response to file and upload
        const fileName = `response_${timestamp}.txt`;
        const fileId = await uploadFileToClientFolder(
          loginKey,
          clientData.client_name || 'unknown_client',
          `${sanitizedQuestion}/answer/${fileName}`,
          new Blob([textResponse], { type: "text/plain" })
        );
        console.log("Text response uploaded as file:", fileName);
        fileIds.push(fileId);
      } else {
        return NextResponse.json(
          { error: "No valid response provided", success: false },
          { status: 400 }
        );
      }

      // Success - the file was uploaded to OneDrive
      // Notify admin by email if admin is set
      try {
        const adminEmail = (clientData as any).admin as string | null;
        if (adminEmail && typeof adminEmail === 'string' && adminEmail.includes('@')) {
          const base = (process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "")) || "https://bridgewell-financial.vercel.app";
          const formUrl = `${base}/client/form/${encodeURIComponent(loginKey)}`;
          const subject = `New submission from ${clientData.client_name || 'Client'} for "${questionText}"`;
          const html = `
            <div style=\"font-family:Arial,sans-serif;font-size:14px;color:#222\">
              <p>Hi,</p>
              <p>The client <strong>${clientData.client_name || 'Unknown'}</strong>${clientData.organization ? ` (<em>${clientData.organization}</em>)` : ''} submitted a response for:</p>
              <p><strong>Question:</strong> ${questionText}</p>
              <p>You can review or download the files here:</p>
              <p><a href=\"${formUrl}\" style=\"display:inline-block;background:#0a66c2;color:#fff;padding:10px 12px;border-radius:6px;text-decoration:none;font-weight:600\" target=\"_blank\" rel=\"noopener\">Open client form</a></p>
              <p>Alternatively, go to the Bridgewell dashboard and enter this access code:</p>
              <p style=\"font-weight:700;font-size:16px\">${loginKey}</p>
              <p style=\"color:#555\">This is an automated notification.</p>
            </div>
          `;
          // Send via Graph directly to avoid any base URL proxy issues
          const accessToken = await getAccessToken();
          const SENDER_UPN = process.env.MAIL_SENDER_UPN || 'clientonboarding@bridgewellfinancial.com';
          const mailResp = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(SENDER_UPN)}/sendMail`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: {
                subject,
                body: { contentType: 'HTML', content: html },
                toRecipients: [{ emailAddress: { address: adminEmail } }],
                from: { emailAddress: { address: SENDER_UPN } }
              },
              saveToSentItems: true
            })
          });
          if (!mailResp.ok) {
            const errText = await mailResp.text().catch(() => '');
            console.error('Graph sendMail failed:', mailResp.status, errText);
          } else {
            console.log('Admin notification sent to', adminEmail);
          }
        }
      } catch (e) {
        console.error('Admin email notification failed:', e);
      }

      return NextResponse.json({ data: { fileIds }, success: true });

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
