import { NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";
import { sanitizeSharePointName } from "@/app/utils/microsoft/graph";

export async function POST(request: Request) {
  try {
    const { loginKey, question } = await request.json();
    if (!loginKey || !question) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: client, error } = await supabase
      .from("clients")
      .select("client_name")
      .eq("login_key", loginKey)
      .single();
    if (error || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clientName: string = client.client_name || "unknown_client";
    const sanitizedClientName = sanitizeSharePointName(clientName);
    const sanitizedQuestion = sanitizeSharePointName(question);
    const clientFolderName = `${sanitizedClientName}_${loginKey}`;

    const { getAccessToken } = await import("@/app/utils/microsoft/auth");
    const accessToken = await getAccessToken();
    const SHAREPOINT_SITE_ID = "bridgewellfinancial.sharepoint.com,80def30d-85bd-4e18-969a-6346931d152d,deb319e5-cef4-4818-9ec3-805bedea8819";
    const SITE_URL = `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_SITE_ID}`;
    const templatePath = `CLIENTS/${clientFolderName}/${sanitizedQuestion}/template`;

    const listChildrenByPath = async (path: string) => {
      let url: string | null = `${SITE_URL}/drive/root:/${path}:/children`;
      const results: Array<{ id: string; name: string; folder?: unknown }> = [];
      while (url) {
        const r: Response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!r.ok) break;
        const p: { value?: Array<{ id: string; name: string; folder?: unknown }>; [k: string]: unknown } = await r.json();
        (p.value || []).forEach((x) => results.push(x));
        const nl = (p as Record<string, unknown>)["@odata.nextLink"];
        url = typeof nl === 'string' ? nl : null;
      }
      return results;
    };

    const deleteRecursivelyByPath = async (path: string) => {
      const children = await listChildrenByPath(path);
      for (const child of children) {
        if (child.folder) {
          await deleteRecursivelyByPath(`${path}/${child.name}`);
          await fetch(`${SITE_URL}/drive/items/${child.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
        } else {
          await fetch(`${SITE_URL}/drive/items/${child.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
        }
      }
    };

    await deleteRecursivelyByPath(templatePath);

    // Immediately clear templates in Supabase for this question
    try {
      await supabase
        .from("questions")
        .update({ templates: JSON.stringify([]) })
        .eq("login_key", loginKey)
        .eq("question", question);
    } catch (dbErr) {
      console.error("Failed to update question templates to empty array:", dbErr);
    }

    // return how many were deleted by recounting children
    const remaining = await listChildrenByPath(templatePath);
    const cleared = remaining.length === 0;
    return NextResponse.json({ success: true, cleared });
  } catch (e) {
    console.error("Error clearing template folder:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


