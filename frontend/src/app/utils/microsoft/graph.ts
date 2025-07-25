import { getAccessToken } from "@/app/utils/microsoft/auth";

const SHAREPOINT_SITE_ID =
  "bridgewellfinancial.sharepoint.com,80def30d-85bd-4e18-969a-6346931d152d,deb319e5-cef4-4818-9ec3-805bedea8819";
export const SITE_URL = `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_SITE_ID}`;

export async function createClientFolder(
  loginKey: string,
  clientName: string
): Promise<string> {
  try {
    console.log("Getting access token for OneDrive...");
    const accessToken = await getAccessToken();
    console.log("Access token:", accessToken);
    console.log("Access token received successfully");

    const sanitizedName = clientName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);
    const folderName = `${sanitizedName}_${loginKey}`;
    console.log("Creating folder with name:", folderName);

    // First, try to create the CLIENTS folder if it doesn't exist
    console.log("Checking if CLIENTS folder exists...");
    console.log("Making request to:", `${SITE_URL}/drive/root:/CLIENTS:/`);
    try {
      const clientsFolderResponse = await fetch(
        `${SITE_URL}/drive/root:/CLIENTS:/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log(
        "CLIENTS folder check response status:",
        clientsFolderResponse.status
      );

      if (!clientsFolderResponse.ok) {
        const error = await clientsFolderResponse.json();
        console.log("CLIENTS folder not found, creating it...");
        console.log("Error details:", error);

        console.log("Making request to create CLIENTS folder...");
        const createClientsFolderResponse = await fetch(
          `${SITE_URL}/drive/root:/CLIENTS:/`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: "CLIENTS",
              folder: {},
              "@microsoft.graph.conflictBehavior": "rename",
            }),
          }
        );

        console.log(
          "Create CLIENTS folder response status:",
          createClientsFolderResponse.status
        );

        if (!createClientsFolderResponse.ok) {
          const error = await createClientsFolderResponse.json();
          console.error("Error creating CLIENTS folder:", error);
          throw new Error(
            `Failed to create CLIENTS folder: ${
              error.message || "Unknown error"
            }`
          );
        }
        console.log("CLIENTS folder created successfully");
      } else {
        console.log("CLIENTS folder already exists");
      }
    } catch (error) {
      console.error("Error checking/creating CLIENTS folder:", error);
      throw error;
    }

    // Now create the client folder inside CLIENTS
    console.log("Creating client folder inside CLIENTS...");
    console.log(
      "Making request to:",
      `${SITE_URL}/drive/root:/CLIENTS/${folderName}:/`
    );
    const response = await fetch(
      `${SITE_URL}/drive/root:/CLIENTS/${folderName}:/`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: folderName,
          folder: {},
          "@microsoft.graph.conflictBehavior": "rename",
        }),
      }
    );

    console.log("Create client folder response status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("OneDrive API error creating client folder:", error);
      throw new Error(
        `Failed to create client folder: ${error.message || "Unknown error"}`
      );
    }

    const data = await response.json();
    console.log("Client folder created successfully with ID:", data.id);
    return data.id;
  } catch (error) {
    console.error("Error in createClientFolder:", error);
    throw error;
  }
}

export async function createQuestionFolders(
  loginKey: string,
  clientName: string,
  questions: Array<{ question: string }>
): Promise<void> {
  try {
    console.log("Getting access token for question folders...");
    const accessToken = await getAccessToken();
    console.log("Access token received successfully");

    const sanitizedClientName = clientName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);
    const clientFolderName = `${sanitizedClientName}_${loginKey}`;
    console.log(
      "Creating question folders in client folder:",
      clientFolderName
    );

    for (const question of questions) {
      const sanitizedQuestion = question.question
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 50);
      const folderName = `${sanitizedQuestion}`;
      console.log("Creating folder for question:", folderName);

      // Create the main question folder
      const questionFolderRes = await fetch(
        `${SITE_URL}/drive/root:/CLIENTS/${clientFolderName}/${folderName}:/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: folderName,
            folder: {},
            "@microsoft.graph.conflictBehavior": "rename",
          }),
        }
      );
      if (!questionFolderRes.ok) {
        const error = await questionFolderRes.json();
        console.error("OneDrive API error creating question folder:", error);
        throw new Error(
          `Failed to create question folder: ${
            error.message || "Unknown error"
          }`
        );
      }
      // Create template and answer subfolders
      for (const subfolder of ["template", "answer"]) {
        const subfolderRes = await fetch(
          `${SITE_URL}/drive/root:/CLIENTS/${clientFolderName}/${folderName}/${subfolder}:/`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: subfolder,
              folder: {},
              "@microsoft.graph.conflictBehavior": "rename",
            }),
          }
        );
        if (!subfolderRes.ok) {
          const error = await subfolderRes.json();
          console.error(
            `OneDrive API error creating ${subfolder} subfolder:`,
            error
          );
          throw new Error(
            `Failed to create ${subfolder} subfolder: ${
              error.message || "Unknown error"
            }`
          );
        }
      }
      console.log(
        "Question folder and subfolders created successfully:",
        folderName
      );
    }
  } catch (error) {
    console.error("Error in createQuestionFolders:", error);
    throw error;
  }
}

export async function copyFileToClientFolder(
  sourceFileId: string,
  loginKey: string,
  clientName: string,
  destinationPath: string
): Promise<string> {
  try {
    // Get access token
    let accessToken;
    try {
      accessToken = await getAccessToken();
    } catch (tokenError) {
      console.error("Error getting access token:", tokenError);
      throw new Error("Authentication failed. Please try again later.");
    }

    const sanitizedClientName = clientName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);
    const clientFolderName = `${sanitizedClientName}_${loginKey}`;
    console.log("Client folder name for copy:", clientFolderName);
    console.log("Using loginKey:", loginKey);

    // Ensure the path includes CLIENTS as the root folder
    const fullDestinationPath = `CLIENTS/${clientFolderName}/${destinationPath}`;
    console.log("Copying file to path:", fullDestinationPath);

    try {
      // Use Microsoft Graph copy API
      const response = await fetch(
        `${SITE_URL}/drive/items/${sourceFileId}/copy`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            parentReference: {
              driveId: "root",
              path: `/CLIENTS/${clientFolderName}/${destinationPath
                .split("/")
                .slice(0, -1)
                .join("/")}`,
            },
            name: destinationPath.split("/").pop(), // Get just the filename
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "Permission denied while copying file. Please contact support."
          );
        } else if (response.status === 404) {
          throw new Error(
            "Source file or destination folder not found. Please try again or contact support."
          );
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        }

        const error = await response.json();
        console.error("Error copying file:", error);
        throw new Error(
          `Copy failed: ${
            error.message || error.error?.message || "Unknown error"
          }`
        );
      }

      const data = await response.json();
      console.log("File copied successfully with ID:", data.id);
      return data.id;
    } catch (fetchError: unknown) {
      // Handle fetch-specific errors
      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          throw new Error("Copy was aborted. Please try again.");
        } else if (
          fetchError.name === "TypeError" &&
          fetchError.message.includes("NetworkError")
        ) {
          throw new Error(
            "Network error. Please check your internet connection and try again."
          );
        } else {
          throw fetchError; // Re-throw other errors
        }
      } else {
        throw new Error("Failed to copy file due to an unexpected error");
      }
    }
  } catch (error) {
    console.error("Error in copyFileToClientFolder:", error);
    if (error instanceof Error) {
      throw error; // Re-throw the error with its message intact
    } else {
      throw new Error("Failed to copy file due to an unexpected error");
    }
  }
}

export async function uploadFileToClientFolder(
  loginKey: string,
  clientName: string,
  filePath: string,
  fileContent: Blob
): Promise<string> {
  try {
    console.log("Getting access token for file upload...");
    const accessToken = await getAccessToken();
    console.log("Access token received successfully");

    const sanitizedClientName = clientName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);
    const clientFolderName = `${sanitizedClientName}_${loginKey}`;
    console.log("Uploading file to client folder:", clientFolderName);
    console.log("File path:", filePath);

    const response = await fetch(
      `${SITE_URL}/drive/root:/CLIENTS/${clientFolderName}/${filePath}:/content`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": fileContent.type,
        },
        body: fileContent,
      }
    );

    console.log("Upload response status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("OneDrive API error uploading file:", error);
      throw new Error(
        `Failed to upload file: ${error.message || "Unknown error"}`
      );
    }

    const data = await response.json();
    console.log("File uploaded successfully with ID:", data.id);
    return data.id;
  } catch (error) {
    console.error("Error in uploadFileToClientFolder:", error);
    throw error;
  }
}

export async function deleteFileFromOneDrive(
  loginKey: string,
  clientName: string,
  filePath: string
): Promise<void> {
  try {
    console.log("Getting access token for file deletion...");
    const accessToken = await getAccessToken();
    console.log("Access token received successfully");

    const sanitizedClientName = clientName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);
    const clientFolderName = `${sanitizedClientName}_${loginKey}`;
    console.log("Deleting file from client folder:", clientFolderName);
    console.log("File path:", filePath);

    const response = await fetch(
      `${SITE_URL}/drive/root:/CLIENTS/${clientFolderName}/${filePath}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("Delete response status:", response.status);

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch {
        // If response is not JSON, get text instead
        const text = await response.text();
        error = { message: text, code: response.status };
      }
      console.error("OneDrive API error deleting file:", {
        status: response.status,
        statusText: response.statusText,
        error,
        filePath,
        clientFolderName
      });
      
      // Don't throw error for 404 (file not found) - it's already deleted
      if (response.status === 404) {
        console.log("File/folder already deleted or doesn't exist");
        return;
      }
      
      throw new Error(
        `Failed to delete file (${response.status}): ${error.message || error.code || "Unknown error"}`
      );
    }

    console.log("File deleted successfully");
  } catch (error) {
    console.error("Error in deleteFileFromOneDrive:", error);
    throw error;
  }
}

export async function checkQuestionCompletion(
  loginKey: string,
  clientName: string,
  questions: Array<{ question: string }>
): Promise<{ [key: string]: boolean }> {
  try {
    const accessToken = await getAccessToken();
    const sanitizedClientName = clientName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);
    const clientFolderName = `${sanitizedClientName}_${loginKey}`;
    console.log(
      "Client folder name for checking completion:",
      clientFolderName
    );
    console.log("Using loginKey for completion check:", loginKey);

    const completionStatus: { [key: string]: boolean } = {};

    for (const question of questions) {
      const sanitizedQuestion = question.question
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 50);
      // Only check the answer subfolder
      const checkPath = `CLIENTS/${clientFolderName}/${sanitizedQuestion}/answer`;
      console.log(
        "Checking completion for path (answer subfolder):",
        checkPath
      );

      const response = await fetch(
        `${SITE_URL}/drive/root:/${checkPath}:/children`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // If the answer subfolder has any items (files), consider the question completed
        completionStatus[question.question] =
          data.value && data.value.length > 0;
        console.log(
          `Question "${question.question}" completion:`,
          completionStatus[question.question],
          data.value ? `(${data.value.length} files found)` : "(no files)"
        );
      } else {
        console.error(
          `Error checking answer subfolder for question: ${question.question}`,
          response.status
        );
        completionStatus[question.question] = false;
      }
    }

    return completionStatus;
  } catch (error) {
    console.error("Error in checkQuestionCompletion:", error);
    return {};
  }
}
