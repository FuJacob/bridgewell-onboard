import { NextResponse } from "next/server";
import { getAccessToken } from "@/app/utils/microsoft/auth";

const SHAREPOINT_SITE_ID =
  "bridgewellfinancial.sharepoint.com,80def30d-85bd-4e18-969a-6346931d152d,deb319e5-cef4-4818-9ec3-805bedea8819";
const BASE_URL = "https://graph.microsoft.com/v1.0";
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

    const sanitizedClientName = clientName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);
    const clientFolderName = `${sanitizedClientName}_${loginKey}`;
    console.log(
      "Client folder name for deleting uploads to x question:",
      clientFolderName
    );
    const listResponse = await fetch(
      `${SITE_URL}/drive/root:/CLIENTS/${clientFolderName}/${question}/answer:/children`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const listData = await listResponse.json();
    console.log(
      "ASDOSADKAOPSDKOPAKSPODKPOASKDPKAPDKPAKSPDAPSKDAPSDOPASDPPKSAKPD",
      listData
    );
    for (const listItem of listData.value) {
      await fetch(`${SITE_URL}/drive/items/${listItem.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
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

    const response = await deleteClientUploadsToQuestion(loginKey, name, question.split(" ").join("_"));
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
