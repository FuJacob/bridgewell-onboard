import { getAccessToken } from "@/app/utils/microsoft/auth";
import type { SharePointError } from "@/types";

const SHAREPOINT_SITE_ID =
  "bridgewellfinancial.sharepoint.com,80def30d-85bd-4e18-969a-6346931d152d,deb319e5-cef4-4818-9ec3-805bedea8819";
export const SITE_URL = `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_SITE_ID}`;

// Enhanced error handling for SharePoint operations
export function handleSharePointError(error: any, operation: string): SharePointError {
  if (!error) {
    return { message: `Unknown error during ${operation}` };
  }

  // Handle fetch errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      message: `Network error during ${operation}. Please check your internet connection.`,
      statusCode: 0,
      details: error.message
    };
  }

  // Handle timeout errors
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return {
      message: `Operation timed out during ${operation}. Please try again.`,
      statusCode: 408,
      details: error.message
    };
  }

  // Handle HTTP response errors
  if (error.status || error.statusCode) {
    const statusCode = error.status || error.statusCode;
    let message = `${operation} failed`;
    
    switch (statusCode) {
      case 401:
        message = 'Authentication failed. Please contact support.';
        break;
      case 403:
        message = 'Access denied. Insufficient permissions for this operation.';
        break;
      case 404:
        message = 'Resource not found. The file or folder may have been moved or deleted.';
        break;
      case 409:
        message = 'Conflict occurred. A file with this name may already exist.';
        break;
      case 429:
        message = 'Too many requests. Please try again in a few minutes.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        message = 'SharePoint service temporarily unavailable. Please try again later.';
        break;
      default:
        message = `${operation} failed with status ${statusCode}`;
    }

    return {
      message,
      statusCode,
      errorCode: error.code || error.error_code,
      details: error.message || error.error_description
    };
  }

  // Generic error fallback
  if (error instanceof Error) {
    return {
      message: `${operation} failed: ${error.message}`,
      details: error.stack
    };
  }

  return { message: `Unexpected error during ${operation}`, details: String(error) };
}

// Retry wrapper for SharePoint operations
export async function withSharePointRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: SharePointError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = handleSharePointError(error, operationName);
      
      // Don't retry for certain error types
      if (lastError.statusCode && [401, 403, 404].includes(lastError.statusCode)) {
        throw new Error(lastError.message);
      }

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`Attempt ${attempt} failed for ${operationName}, retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(lastError!.message);
}

// Sanitize names for SharePoint compatibility
export function sanitizeSharePointName(name: string, maxLength: number = 50): string {
  if (!name || typeof name !== 'string') {
    throw new Error('Invalid name provided for sanitization');
  }

  return name
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid SharePoint characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Remove consecutive underscores
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, maxLength) || 'unnamed'; // Ensure we have a name
}

export async function createClientFolder(
  loginKey: string,
  clientName: string
): Promise<string> {
  // Validate inputs
  if (!loginKey || typeof loginKey !== 'string') {
    throw new Error('Invalid login key provided');
  }
  if (!clientName || typeof clientName !== 'string') {
    throw new Error('Invalid client name provided');
  }

  return withSharePointRetry(async () => {
    console.log("Getting access token for OneDrive...");
    const accessToken = await getAccessToken();
    console.log("Access token received successfully");

    const sanitizedName = sanitizeSharePointName(clientName);
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
        if (clientsFolderResponse.status === 404) {
          console.log("CLIENTS folder not found, creating it...");
          
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

          if (!createClientsFolderResponse.ok) {
            const error = await createClientsFolderResponse.json().catch(() => ({}));
            throw {
              status: createClientsFolderResponse.status,
              message: error.message || `HTTP ${createClientsFolderResponse.status}`,
              error
            };
          }
          console.log("CLIENTS folder created successfully");
        } else {
          const error = await clientsFolderResponse.json().catch(() => ({}));
          throw {
            status: clientsFolderResponse.status,
            message: error.message || `HTTP ${clientsFolderResponse.status}`,
            error
          };
        }
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
      const error = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: error.message || `HTTP ${response.status}`,
        error
      };
    }

    const data = await response.json();
    console.log("Client folder created successfully with ID:", data.id);
    return data.id;
  }, "create client folder");
}

export async function createQuestionFolders(
  loginKey: string,
  clientName: string,
  questions: Array<{ question: string }>
): Promise<void> {
  // Validate inputs
  if (!loginKey || typeof loginKey !== 'string') {
    throw new Error('Invalid login key provided');
  }
  if (!clientName || typeof clientName !== 'string') {
    throw new Error('Invalid client name provided');
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Invalid questions array provided');
  }

  return withSharePointRetry(async () => {
    console.log("Getting access token for question folders...");
    const accessToken = await getAccessToken();
    console.log("Access token received successfully");

    const sanitizedClientName = sanitizeSharePointName(clientName);
    const clientFolderName = `${sanitizedClientName}_${loginKey}`;
    console.log(
      "Creating question folders in client folder:",
      clientFolderName
    );

    for (const question of questions) {
      if (!question.question || typeof question.question !== 'string') {
        console.warn('Skipping invalid question:', question);
        continue;
      }

      const sanitizedQuestion = sanitizeSharePointName(question.question);
      const folderName = sanitizedQuestion;
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
        const error = await questionFolderRes.json().catch(() => ({}));
        throw {
          status: questionFolderRes.status,
          message: error.message || `Failed to create question folder: HTTP ${questionFolderRes.status}`,
          error
        };
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
          const error = await subfolderRes.json().catch(() => ({}));
          throw {
            status: subfolderRes.status,
            message: error.message || `Failed to create ${subfolder} subfolder: HTTP ${subfolderRes.status}`,
            error
          };
        }
      }
      console.log(
        "Question folder and subfolders created successfully:",
        folderName
      );
    }
  }, "create question folders");
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
