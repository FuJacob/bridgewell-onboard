import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/app/utils/microsoft/auth";
import { getSiteURL, withSharePointRetry, sanitizeSharePointName } from "@/app/utils/microsoft/graph";
import JSZip from "jszip";

const REQUEST_TIMEOUT = 30000; // 30 seconds per file download

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

      console.log(
        `Downloading file ${i + 1}/${fileIdArray.length}, ID: ${fileId}`
      );

      try {
        const { response } = await withSharePointRetry(async () => {
          const accessToken = await getAccessToken();
          const graphUrl = `${getSiteURL()}/drive/items/${fileId}/content`;
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
          
          try {
            const response = await fetch(graphUrl, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              throw {
                status: response.status,
                message: `HTTP ${response.status}`,
              };
            }

            return { response };
          } catch (error) {
            clearTimeout(timeoutId);
            throw error;
          }
        }, `download file ${fileId}`);

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

        // Sanitize filename for zip entry
        const sanitizedFileName = sanitizeSharePointName(fileName, 100);

        console.log(`Parsed filename: "${fileName}" -> sanitized: "${sanitizedFileName}" for fileId: ${fileId}`);
        console.log(
          `File info - ID: ${fileId}, Name: ${sanitizedFileName}, Size: ${fileBuffer.byteLength} bytes`
        );

        zip.file(sanitizedFileName, fileBuffer);
        successfulDownloads++;
      } catch (error) {
        console.error(
          `Failed to download file ${fileId}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        // Continue with other files even if one fails
        continue;
      }
    }

    console.log(
      `Successfully downloaded ${successfulDownloads}/${fileIdArray.length} files`
    );

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    const zipFileName = questionText
      ? `${sanitizeSharePointName(questionText, 30)}_templates.zip`
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
