import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/app/utils/microsoft/auth";
import { getSiteURL, withSharePointRetry } from "@/app/utils/microsoft/graph";

const REQUEST_TIMEOUT = 30000; // 30 seconds for downloads

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get("fileId");
  if (!fileId || typeof fileId !== 'string') {
    return NextResponse.json({ error: "Invalid or missing fileId" }, { status: 400 });
  }

  try {
    const { response, contentType, contentDisposition } = await withSharePointRetry(async () => {
      const accessToken = await getAccessToken();
      // Use the SharePoint site drive endpoint for application tokens
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
          const error = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw {
            status: response.status,
            message: error.message || `HTTP ${response.status}`,
            error
          };
        }

        return {
          response,
          contentType: response.headers.get("content-type") || "application/octet-stream",
          contentDisposition: response.headers.get("content-disposition") || "attachment"
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }, "download template file");

    // Stream the file to the client
    const fileBuffer = await response.arrayBuffer();
    return new NextResponse(Buffer.from(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (err) {
    console.error("Error downloading template file:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to download file";
    let statusCode = 500;
    
    if (errorMessage.includes("not found") || errorMessage.includes("404")) {
      statusCode = 404;
    } else if (errorMessage.includes("timeout")) {
      statusCode = 408;
    } else if (errorMessage.includes("Authentication")) {
      statusCode = 401;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
} 