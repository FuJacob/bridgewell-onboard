import { NextResponse } from "next/server";
import { getAccessToken } from "@/app/utils/microsoft/auth";
import { list } from "postcss";

const SHAREPOINT_SITE_ID =
  "bridgewellfinancial.sharepoint.com,80def30d-85bd-4e18-969a-6346931d152d,deb319e5-cef4-4818-9ec3-805bedea8819";
const BASE_URL = "https://graph.microsoft.com/v1.0";
const SITE_URL = `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_SITE_ID}`;

export async function DELETE(request: Request) {
  try {
    const { loginKey, clientName } = await request.json();
    const accessToken = await getAccessToken();

    const clientFolderName = `${clientName}_${loginKey}`;
    console.log(
      "Client folder name for deleting uploads to x question:",
      clientFolderName
    );

    const deleteChildFolder = async (itemPath: string, accessToken: string) => {
      const listResponse = await fetch(
        `${SITE_URL}/drive/root:/CLIENTS/${itemPath}:/children`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!listResponse.ok) {
        console.error("Error fetching child items:", listResponse.statusText);
        return;
      }

      const listData = await listResponse.json();

      console.log("List data for child folder deletion:", listData);

      for (const child of listData.value) {
        if (child.folder) {
          console.log("Child FOLDER to be deleted:", child.name);
          deleteChildFolder(`${itemPath}/${child.name}`, accessToken);
        } else {
          console.log("Child item to be deleted:", child.name);
          const deleteResponse = await fetch(
            `${SITE_URL}/drive/items/${child.id}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
        }

        const removeOriginalFolder = await fetch(
          `${SITE_URL}/drive/items/${child.id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }
    };

    const removeClientFolderFinish = deleteChildFolder(
      `/${clientFolderName}`,
      accessToken
    );

    const removeOriginalFolder = await fetch(
      `${SITE_URL}/drive/items/${clientFolderName}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (removeClientFolderFinish) {
      return NextResponse.json({
        message: "Client folder deleted successfully",
        status: removeClientFolderFinish.status,
      });
    } else {
      NextResponse.json({
        message: "Client folder not found",
        status: removeClientFolderFinish.status,
      });
    }
  } catch (error) {
    console.error("Error deleting client folder");
  }
}
