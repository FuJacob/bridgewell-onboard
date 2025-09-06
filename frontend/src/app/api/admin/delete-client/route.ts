import { NextResponse } from "next/server";
import { getAccessToken } from "@/app/utils/microsoft/auth";
import { createServiceClient } from "@/app/utils/supabase/server";
import { sanitizeSharePointName } from "@/app/utils/microsoft/graph";

const SHAREPOINT_SITE_ID =
  "bridgewellfinancial.sharepoint.com,80def30d-85bd-4e18-969a-6346931d152d,deb319e5-cef4-4818-9ec3-805bedea8819";
const SITE_URL = `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_SITE_ID}`;

export async function DELETE(request: Request) {
  try {
    const { loginKey, clientName } = await request.json();
    const accessToken = await getAccessToken();
    console.log("Access token:", accessToken);
    // Delete from Supabase first using service role (bypass RLS)
    const supabase = createServiceClient();
    const { data: deletedForms, error } = await supabase
      .from("clients")
      .delete()
      .eq("login_key", loginKey)
      .select("*");

    console.log("Deleted from Supabase:", deletedForms);
    if (error) {
      console.error("Supabase deletion error:", error.message);
      return NextResponse.json({
        message: "Failed to delete from database",
        error: error.message,
        status: 500,
      });
    }

    const { data: deletedQuestions, error: questionError } = await supabase
      .from("questions")
      .delete()
      .eq("login_key", loginKey)
      .select("*");

    console.log("Deleted questions from Supabase:", deletedQuestions);
    if (questionError) {
      console.error("Supabase deletion error:", questionError.message);
      return NextResponse.json({
        message: "Failed to delete questions from database",
        error: questionError.message,
        status: 500,
      });
    }

    const sanitizedClientName = sanitizeSharePointName(clientName);
    const clientFolderName = `${sanitizedClientName}_${loginKey}`;
    console.log(
      "Client folder name for deleting uploads to x question:",
      clientFolderName
    );

    const deleteChildFolder = async (itemPath: string, accessToken: string) => {
      // Paginate through children; recurse into subfolders; delete items by id
      let nextUrl: string | null = `${SITE_URL}/drive/root:/CLIENTS/${itemPath}:/children`;
      while (nextUrl) {
        const resp: Response = await fetch(nextUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!resp.ok) {
          console.error("Error fetching child items:", resp.status, await resp.text().catch(() => ""));
          break;
        }
        const page: { value?: Array<{ id: string; name: string; folder?: unknown }>; [k: string]: unknown } = await resp.json();
        for (const child of page.value || []) {
          if (child.folder) {
            console.log("Child FOLDER to be deleted:", child.name);
            await deleteChildFolder(`${itemPath}/${child.name}`, accessToken);
          } else {
            console.log("Child item to be deleted:", child.name);
          }

          const deleteResponse = await fetch(`${SITE_URL}/drive/items/${child.id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (!deleteResponse.ok && deleteResponse.status !== 404) {
            console.error(`Error deleting ${child.name}:`, deleteResponse.status, await deleteResponse.text().catch(() => ""));
          }
        }

        const nextLink = (page as Record<string, unknown>)["@odata.nextLink"];
        nextUrl = typeof nextLink === "string" ? nextLink : null;
      }
    };

    // Delete the client folder and all its contents
    await deleteChildFolder(`${clientFolderName}`, accessToken);

    // Delete the main client folder
    const removeOriginalFolder = await fetch(
      `${SITE_URL}/drive/root:/CLIENTS/${clientFolderName}:`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (removeOriginalFolder.ok) {
      return NextResponse.json({
        message: "Client folder deleted successfully",
        status: 200,
      });
    } else {
      return NextResponse.json({
        message: "Client folder not found or could not be deleted",
        status: removeOriginalFolder.status,
      });
    }
  } catch (error) {
    console.error("Error deleting client folder:", error);
    return NextResponse.json({
      message: "Internal server error",
      status: 500,
    });
  }
}
