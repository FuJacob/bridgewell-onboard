import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/app/utils/microsoft/auth";
import { SITE_URL } from "@/app/utils/microsoft/graph";
import JSZip from "jszip";

export async function GET(req: NextRequest) {
  const fileIds = req.nextUrl.searchParams.get("fileIds");
  const questionText = req.nextUrl.searchParams.get("question");
  
  if (!fileIds) {
    return NextResponse.json({ error: "Missing fileIds" }, { status: 400 });
  }

  try {
    const accessToken = await getAccessToken();
    const fileIdArray = fileIds.split(',');
    const zip = new JSZip();

    // Download each file and add to zip
    for (let i = 0; i < fileIdArray.length; i++) {
      const fileId = fileIdArray[i];
      const graphUrl = `${SITE_URL}/drive/items/${fileId}/content`;
      const response = await fetch(graphUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error(`Failed to download file ${fileId}:`, response.status);
        continue;
      }

      const fileBuffer = await response.arrayBuffer();
      const fileName = response.headers.get("content-disposition")?.split('filename=')[1]?.replace(/"/g, '') || `template_${i + 1}`;
      
      zip.file(fileName, fileBuffer);
    }

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    
    const zipFileName = questionText 
      ? `${questionText.replace(/[^a-zA-Z0-9]/g, '_')}_templates.zip`
      : "templates.zip";

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFileName}"`,
      },
    });
  } catch (err) {
    console.error("Error downloading templates:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 