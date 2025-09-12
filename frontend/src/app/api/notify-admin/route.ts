import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/app/utils/microsoft/auth";

const SENDER_UPN = process.env.MAIL_SENDER_UPN || "clientonboarding@bridgewellfinancial.com";

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html } = await req.json();
    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    const resp = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(SENDER_UPN)}/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            subject,
            body: { contentType: "HTML", content: html },
            toRecipients: [{ emailAddress: { address: to } }],
            from: { emailAddress: { address: SENDER_UPN } },
          },
          saveToSentItems: true,
        }),
      }
    );

    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      return NextResponse.json({ error: `Graph sendMail failed: ${resp.status} ${t}` }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


