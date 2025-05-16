import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/app/utils/microsoft/auth";
import { SITE_URL } from "@/app/utils/microsoft/graph";

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get("fileId");
  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  try {
    const accessToken = await getAccessToken();
    // Use the SharePoint site drive endpoint for application tokens
    const graphUrl = `${SITE_URL}/drive/items/${fileId}/content`;
    const response = await fetch(graphUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error }, { status: response.status });
    }

    // Stream the file to the client
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = response.headers.get("content-disposition") || "attachment";
    const fileBuffer = await response.arrayBuffer();
    return new NextResponse(Buffer.from(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 