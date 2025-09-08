import { NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";
import { getAccessToken } from "@/app/utils/microsoft/auth";
import { sanitizeSharePointName, getSiteURL } from "@/app/utils/microsoft/graph";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null as any);
    const { loginKey, question, mode, fileName, fileId } = body || {};

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
      // No DB metadata needed; completion checks look at OneDrive
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err) {
    console.error("finalize upload error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


