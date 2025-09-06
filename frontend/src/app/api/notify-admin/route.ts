import { NextRequest, NextResponse } from "next/server";

// Placeholder email sender endpoint. In production, wire to SendGrid/Resend etc.
export async function POST(req: NextRequest) {
  try {
    const { to, subject, html } = await req.json();
    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    // TODO: integrate with a real email provider
    console.log('[notify-admin] to:', to, 'subject:', subject);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


