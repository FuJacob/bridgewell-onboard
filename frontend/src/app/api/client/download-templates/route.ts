import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/app/utils/microsoft/auth";
import { SITE_URL } from "@/app/utils/microsoft/graph";
import JSZip from "jszip";

export async function GET(req: NextRequest) {
  const fileIds = req.nextUrl.searchParams.get("fileIds");
  const questionText = req.nextUrl.searchParams.get("question");

  console.log("Download templates called with:", { fileIds, questionText });

  if (!fileIds || fileIds.trim() === "") {
    console.log("Missing or empty fileIds parameter");
    return NextResponse.json(
      { error: "Missing or empty fileIds parameter" },
      { status: 400 }
    );
  }

  try {
    const accessToken = await getAccessToken();
    const fileIdArray = fileIds.split(",").filter((id) => id.trim() !== "");

    console.log("Processing file IDs:", fileIdArray);

    if (fileIdArray.length === 0) {
      console.log("No valid file IDs after filtering");
      return NextResponse.json(
        { error: "No valid file IDs provided" },
        { status: 400 }
      );
    }

    const zip = new JSZip();
    let successfulDownloads = 0;

    // Download each file and add to zip
    for (let i = 0; i < fileIdArray.length; i++) {
      const fileId = fileIdArray[i];
      const graphUrl = `${SITE_URL}/drive/items/${fileId}/content`;

      console.log(
        `Downloading file ${i + 1}/${fileIdArray.length}, ID: ${fileId}`
      );

      const response = await fetch(graphUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error(
          `Failed to download file ${fileId}:`,
          response.status,
          response.statusText
        );
        continue;
      }

      console.log(
        `File ${fileId} response headers:`,
        Object.fromEntries(response.headers.entries())
      );

      const fileBuffer = await response.arrayBuffer();
      const contentDisposition = response.headers.get("content-disposition");
      console.log(`Content-Disposition header:`, contentDisposition);

      const fileName =
        response.headers
          .get("content-disposition")
          ?.split("filename=")[1]
          ?.replace(/"/g, "") || `template_${i + 1}`;

      console.log(`Parsed filename: "${fileName}" for fileId: ${fileId}`);
      console.log(
        `File info - ID: ${fileId}, Name: ${fileName}, Size: ${fileBuffer.byteLength} bytes`
      );

      zip.file(fileName, fileBuffer);
      successfulDownloads++;
    }

    console.log(
      `Successfully downloaded ${successfulDownloads}/${fileIdArray.length} files`
    );

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    const zipFileName = questionText
      ? `${questionText.replace(/[^a-zA-Z0-9]/g, "_")}_templates.zip`
      : "templates.zip";

    console.log(
      `Generated zip file: ${zipFileName} (${zipBuffer.length} bytes)`
    );

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFileName}"`,
      },
    });
  } catch (err) {
    console.error("Error downloading templates:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
