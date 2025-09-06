import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";
import { getAccessToken } from "@/app/utils/microsoft/auth";
import { getSiteURL } from "@/app/utils/microsoft/graph";
import JSZip from "jszip";

function sanitizeSharePointName(name: string, maxLength = 50): string {
  return (name || "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .substring(0, maxLength);
}

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
    const sanitizedQuestion = sanitizeSharePointName(question, 50);
    const basePath = `CLIENTS/${clientFolderName}/${sanitizedQuestion}/answer`;

    // List all files under the answer folder (no recursion expected normally)
    const listUrl = `${getSiteURL()}/drive/root:/${basePath}:/children`;
    const listResp = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!listResp.ok) {
      const t = await listResp.text().catch(() => "");
      return NextResponse.json(
        { error: `Failed to list answer files: ${listResp.status} ${t}` },
        { status: 502 }
      );
    }
    const list = await listResp.json();
    const items: Array<{ id: string; name: string }> = (list.value || [])
      .filter((v: any) => !v.folder && v.id && v.name)
      .map((v: any) => ({ id: v.id as string, name: String(v.name) }));

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
        const safeName = sanitizeSharePointName(item.name, 100);
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


