import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";
import { getAccessToken } from "@/app/utils/microsoft/auth";
import { getSiteURL, sanitizeSharePointName } from "@/app/utils/microsoft/graph";
import JSZip from "jszip";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const question = req.nextUrl.searchParams.get("question");

  if (!key || !question) {
    return NextResponse.json({ error: "Missing key or question" }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const { data: clientRow, error } = await supabase
      .from("clients")
      .select("client_name")
      .eq("login_key", key)
      .single();
    if (error || !clientRow) {
      return NextResponse.json({ error: "Invalid login key" }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    const sanitizedClient = sanitizeSharePointName(clientRow.client_name || "unknown_client");
    const clientFolderName = `${sanitizedClient}_${key}`;
    const sanitizedQuestion = sanitizeSharePointName(question || "");
    const basePath = `CLIENTS/${clientFolderName}/${sanitizedQuestion}/answer`;

    // List all files (with pagination) under the answer folder by path
    const items: Array<{ id: string; name: string }> = [];
    let url: string | null = `${getSiteURL()}/drive/root:/${basePath}:/children`;
    while (url) {
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!resp.ok) {
        if (resp.status === 404) {
          return NextResponse.json({ error: "No files found in answer folder" }, { status: 404 });
        }
        const t = await resp.text().catch(() => "");
        return NextResponse.json({ error: `Failed to list answer files: ${resp.status} ${t}` }, { status: 502 });
      }
      const list = await resp.json();
      (list.value || [])
        .filter((v: any) => !v.folder && v.id && v.name)
        .forEach((v: any) => items.push({ id: String(v.id), name: String(v.name) }));
      url = typeof list["@odata.nextLink"] === 'string' ? list["@odata.nextLink"] : null;
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "No files found in answer folder" }, { status: 404 });
    }

    const zip = new JSZip();
    let downloaded = 0;
    for (const item of items) {
      try {
        const fileResp = await fetch(`${getSiteURL()}/drive/items/${item.id}/content`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!fileResp.ok) {
          continue;
        }
        const buf = await fileResp.arrayBuffer();
        const safeName = sanitizeSharePointName(item.name || "", 100);
        zip.file(safeName || `answer_${downloaded + 1}`, buf);
        downloaded++;
      } catch {
        // skip failed
      }
    }

    if (downloaded === 0) {
      return NextResponse.json({ error: "Unable to download files" }, { status: 502 });
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const zipName = `${sanitizeSharePointName(question, 30)}_answers.zip`;
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`,
      },
    });
  } catch (err) {
    console.error("download-answers error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


