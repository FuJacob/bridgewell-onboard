import { NextResponse } from "next/server";
import { getAccessToken } from "@/app/utils/microsoft/auth";
import { sanitizeSharePointName, getSiteURL } from "@/app/utils/microsoft/graph";

const SHAREPOINT_SITE_ID =
  "bridgewellfinancial.sharepoint.com,80def30d-85bd-4e18-969a-6346931d152d,deb319e5-cef4-4818-9ec3-805bedea8819";
const SITE_URL = `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_SITE_ID}`;

async function deleteClientUploadsToQuestion(
  loginKey: string,
  clientName: string,
  question: string
) {
  try {
    let accessToken;
    try {
      accessToken = await getAccessToken();
      console.log("Access token retrieved successfully", accessToken);
    } catch (tokenError) {
      console.error("Error getting access token:", tokenError);
      throw new Error("Authentication failed. Please try again later.");
    }

    const sanitizedClientName = sanitizeSharePointName(clientName || "unknown_client");
    const clientFolderName = `${sanitizedClientName}_${loginKey}`;
    console.log(
      "Client folder name for deleting uploads to x question:",
      clientFolderName
    );
    const sanitizedQuestion = sanitizeSharePointName(question || "");

    // List children with pagination; tolerate missing folder (treat as cleared)
    const baseChildrenUrl = `${getSiteURL()}/drive/root:/CLIENTS/${clientFolderName}/${sanitizedQuestion}/answer:/children`;
    const toDelete: Array<{ id: string; isFolder: boolean; name: string }> = [];
    let url: string | null = baseChildrenUrl;
    while (url) {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!r.ok) {
        if (r.status === 404) {
          // Nothing to clear
          return true;
        }
        const msg = await r.text().catch(() => "");
        throw new Error(`List failed ${r.status}: ${msg}`);
      }
      const p: any = await r.json();
      (p.value || []).forEach((v: any) => toDelete.push({ id: String(v.id), isFolder: !!v.folder, name: String(v.name || "") }));
      url = typeof p["@odata.nextLink"] === 'string' ? p["@odata.nextLink"] : null;
    }

    // For folders, delete recursively by item id; for files, delete directly
    for (const item of toDelete) {
      await fetch(`${getSiteURL()}/drive/items/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
    }

    return true;
  } catch (error) {
    console.error("Error in deleteClientUploadsToQuestion:", error);
    throw error;
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { loginKey, name, question } = await request.json();

    if (!loginKey || !name || !question) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await deleteClientUploadsToQuestion(loginKey, name, question);
    return NextResponse.json({
      message: "Question reset successfully",
      success: response,
    });
  } catch (error) {
    console.error("Error in redo-question:", error);
    return NextResponse.json(
      {
        error: `Server error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
