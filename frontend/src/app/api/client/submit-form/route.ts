import { NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";
import { uploadFileToClientFolder } from "@/app/utils/microsoft/graph";
import { getAccessToken } from "@/app/utils/microsoft/auth";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const loginKey = formData.get("loginKey") as string;
    const responses = formData.get("responses") as string;
    const files = formData.getAll("files") as File[];

    const supabase = createServiceClient();

    // Get client information
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("client_name, organization, admin")
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

    // Notify admin by email if configured
    try {
      const SENDER_UPN = process.env.MAIL_SENDER_UPN || "clientonboarding@bridgewellfinancial.com";
      const accessToken = await getAccessToken();
      const base = (process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "")) || "https://bridgewell-financial.vercel.app";
      const formUrl = `${base}/client/form/${encodeURIComponent(loginKey)}`;
      const subject = `New submission from ${clientData.client_name || 'Client'} (${uploadedFiles.length} file${uploadedFiles.length === 1 ? '' : 's'})`;
      const html = `
        <div style=\"font-family:Arial,sans-serif;font-size:14px;color:#222\">
          <p>Hi,</p>
          <p>The client <strong>${clientData.client_name || 'Unknown'}</strong>${clientData.organization ? ` (<em>${clientData.organization}</em>)` : ''} submitted answers.</p>
          <p><a href=\"${formUrl}\" style=\"display:inline-block;background:#0a66c2;color:#fff;padding:10px 12px;border-radius:6px;text-decoration:none;font-weight:600\" target=\"_blank\" rel=\"noopener\">Open client form</a></p>
          <p>Alternatively, go to the Bridgewell dashboard and enter this access code:</p>
          <p style=\"font-weight:700;font-size:16px\">${loginKey}</p>
          <p style=\"color:#555\">This is an automated notification.</p>
        </div>
      `;
      const adminEmail = (clientData as any).admin as string | undefined;
      if (adminEmail && adminEmail.includes('@')) {
        const mailResp = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(SENDER_UPN)}/sendMail`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
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
          console.error('Graph sendMail (submit-form) failed:', mailResp.status, errText);
        } else {
          console.log('Admin (submit-form) notification sent to', adminEmail);
        }
      }
    } catch (notifyErr) {
      console.error('Admin notify (submit-form) error:', notifyErr);
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
