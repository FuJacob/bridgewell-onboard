import { NextResponse } from "next/server";
import { getAccessToken } from "@/app/utils/microsoft/auth";
import { sanitizeSharePointName } from "@/app/utils/microsoft/graph";
import { createServiceClient } from "@/app/utils/supabase/server";

// Node runtime (needs fetch with large bodies support on platform)
export const runtime = "nodejs";

const SHAREPOINT_SITE_ID =
  "bridgewellfinancial.sharepoint.com,80def30d-85bd-4e18-969a-6346931d152d,deb319e5-cef4-4818-9ec3-805bedea8819";
const SITE_URL = `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_SITE_ID}`;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null as any);
    const rawClientName = body?.clientName ?? body?.client ?? null;
    const rawQuestion = body?.question ?? body?.questionText ?? null;
    const loginKey = body?.loginKey;
    const folderType = body?.folderType;
    const filename = body?.filename;

    if (!loginKey || !folderType || !filename) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Resolve clientName if not provided
    let clientName: string | null = typeof rawClientName === 'string' && rawClientName.trim() ? rawClientName : null;
    if (!clientName) {
      try {
        const supabase = createServiceClient();
        const { data } = await supabase.from('clients').select('client_name').eq('login_key', loginKey).maybeSingle();
        clientName = (data?.client_name as string) || null;
      } catch {}
    }
    const question = typeof rawQuestion === 'string' ? rawQuestion : '';
    if (!clientName || !question) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (folderType !== "answer" && folderType !== "template") {
      return NextResponse.json({ error: "Invalid folderType" }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    const sanitizedClient = sanitizeSharePointName(clientName || "unknown_client");
    const sanitizedQuestion = sanitizeSharePointName(question || "");
    const clientFolderName = `${sanitizedClient}_${loginKey}`;

    const targetPath = `CLIENTS/${clientFolderName}/${sanitizedQuestion}/${folderType}/${filename}`;

    // Create upload session (resumable)
    const createResp = await fetch(
      `${SITE_URL}/drive/root:/${encodeURI(targetPath)}:/createUploadSession`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item: {
            "@microsoft.graph.conflictBehavior": "replace",
            name: filename,
          },
        }),
      }
    );

    if (!createResp.ok) {
      const t = await createResp.text().catch(() => "");
      return NextResponse.json(
        { error: `Failed to create upload session: ${createResp.status} ${t}` },
        { status: 502 }
      );
    }

    const session = await createResp.json();
    const uploadUrl = session?.uploadUrl as string | undefined;
    if (!uploadUrl) {
      return NextResponse.json({ error: "No uploadUrl returned" }, { status: 502 });
    }

    return NextResponse.json({ success: true, uploadUrl });
  } catch (err) {
    console.error("create-session error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


