import { NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";
import { getAccessToken } from "@/app/utils/microsoft/auth";
import { sanitizeSharePointName, getSiteURL } from "@/app/utils/microsoft/graph";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null as any);
    const { loginKey, mode, fileName, fileId } = body || {};
    const rawQuestion = (body && (body.question ?? body.questionText)) as string | undefined;
    const question = typeof rawQuestion === 'string' ? rawQuestion : undefined;

    if (!loginKey || !question || !mode || !fileName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    if (mode === "template") {
      // Append to templates array for matching question
      const { data: qs, error } = await supabase
        .from("questions")
        .select("id, templates")
        .eq("login_key", loginKey)
        .eq("question", question)
        .maybeSingle();
      if (error || !qs) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
      }
      let templates: Array<{ fileName: string; fileId: string; uploadedAt?: string }> = [];
      try {
        if (typeof qs.templates === 'string') templates = JSON.parse(qs.templates);
        else if (Array.isArray(qs.templates)) templates = qs.templates as any;
      } catch {}
      templates = Array.isArray(templates) ? templates : [];
      let resolvedFileId: string | undefined = typeof fileId === 'string' && fileId.length > 0 ? fileId : undefined;
      // If fileId not provided (common for some large final chunk responses), attempt to resolve by path
      if (!resolvedFileId) {
        try {
          // Lookup client name
          const { data: clientRow } = await supabase
            .from('clients')
            .select('client_name')
            .eq('login_key', loginKey)
            .maybeSingle();
          const clientName = clientRow?.client_name as string | undefined;
          if (clientName) {
            const accessToken = await getAccessToken();
            const sanitizedClient = sanitizeSharePointName(clientName);
            const sanitizedQuestion = sanitizeSharePointName(question as string);
            // Keep spaces in filename but strip illegal chars
            const safeFileName = String(fileName || '')
              .replace(/[\\/:*?"<>|]/g, '_')
              .replace(/[\x00-\x1f\x80-\x9f]/g, '_')
              .replace(/\.+$/g, '')
              .replace(/_{2,}/g, '_')
              .replace(/^_+|_+$/g, '') || 'unnamed';
            const clientFolderName = `${sanitizedClient}_${loginKey}`;
            const filePath = `CLIENTS/${clientFolderName}/${sanitizedQuestion}/template/${safeFileName}`;
            const res = await fetch(`${getSiteURL()}/drive/root:/${encodeURI(filePath)}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (res.ok) {
              const meta = await res.json();
              if (typeof meta?.id === 'string') {
                resolvedFileId = meta.id;
              }
            }
          }
        } catch (_) {}
      }
      if (resolvedFileId) {
        templates.push({ fileName, fileId: resolvedFileId, uploadedAt: new Date().toISOString() });
      }
      const { error: upErr } = await supabase
        .from("questions")
        .update({ templates: JSON.stringify(templates) })
        .eq("id", qs.id);
      if (upErr) {
        return NextResponse.json({ error: "Failed to update templates" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (mode === "answer") {
      // Send admin notification email similar to submit-question route
      try {
        const { data: clientData } = await supabase
          .from("clients")
          .select("client_name, organization, admin")
          .eq("login_key", loginKey)
          .maybeSingle();

        const adminEmail = (clientData as any)?.admin as string | null;
        if (adminEmail && typeof adminEmail === 'string' && adminEmail.includes('@')) {
          const base = (process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "")) || "https://bridgewell-financial.vercel.app";
          const formUrl = `${base}/client/form/${encodeURIComponent(loginKey)}`;
          const subject = `New submission from ${clientData?.client_name || 'Client'} for "${question}"`;
          const html = `
            <div style=\"font-family:Arial,sans-serif;font-size:14px;color:#222\">
              <p>Hi,</p>
              <p>The client <strong>${clientData?.client_name || 'Unknown'}</strong>${clientData?.organization ? ` (<em>${clientData.organization}</em>)` : ''} submitted a response for:</p>
              <p><strong>Question:</strong> ${question}</p>
              <p>You can review or download the files here:</p>
              <p><a href=\"${formUrl}\" style=\"display:inline-block;background:#0a66c2;color:#fff;padding:10px 12px;border-radius:6px;text-decoration:none;font-weight:600\" target=\"_blank\" rel=\"noopener\">Open client form</a></p>
              <p>Alternatively, go to the Bridgewell dashboard and enter this access code:</p>
              <p style=\"font-weight:700;font-size:16px\">${loginKey}</p>
              <p style=\"color:#555\">This is an automated notification.</p>
            </div>
          `;

          const accessToken = await getAccessToken();
          const SENDER_UPN = process.env.MAIL_SENDER_UPN || 'clientonboarding@bridgewellfinancial.com';
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
            console.error('Graph sendMail (finalize answer) failed:', mailResp.status, errText);
          } else {
            console.log('Admin (finalize answer) notification sent to', adminEmail);
          }
        }
      } catch (notifyErr) {
        console.error('Admin notify (finalize answer) error:', notifyErr);
      }

      // No DB metadata needed; completion checks look at OneDrive
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err) {
    console.error("finalize upload error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


