import { getAccessToken } from "@/app/utils/microsoft/auth";
import type { SharePointError } from "@/types";

// Hardcoded SharePoint configuration
const SHAREPOINT_SITE_ID = "bridgewellfinancial.sharepoint.com,80def30d-85bd-4e18-969a-6346931d152d,deb319e5-cef4-4818-9ec3-805bedea8819";

function getSiteUrl(): string {
  return `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_SITE_ID}`;
}

// Export for external use
export function getSiteURL(): string {
  return getSiteUrl();
}
const REQUEST_TIMEOUT = 60000; // 60 seconds for file operations
const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB limit for large file uploads
const SMALL_FILE_THRESHOLD = 4 * 1024 * 1024; // 4MB threshold for simple upload

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

// Enhanced sanitization for SharePoint compatibility
export function sanitizeSharePointName(name: string, maxLength: number = 50): string {
  if (!name || typeof name !== 'string') {
    throw new Error('Invalid name provided for sanitization');
  }

  // SharePoint invalid characters: \ / : * ? " < > |
  // Also handle other problematic characters
  let sanitized = name
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_') // Replace SharePoint invalid characters
    .replace(/[\x00-\x1f\x80-\x9f]/g, '_') // Replace control characters
    .replace(/\.+$/g, '') // Remove trailing dots
    .replace(/\s+/g, '_') // Replace whitespace with underscores
    .replace(/_{2,}/g, '_') // Collapse multiple underscores
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

  // Handle reserved SharePoint names
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5',
    'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5',
    'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];
  
  if (reservedNames.includes(sanitized.toUpperCase())) {
    sanitized = `${sanitized}_file`;
  }

  // Ensure we have a valid name
  if (!sanitized || sanitized.length === 0) {
    sanitized = 'unnamed';
  }

  // Truncate to max length but preserve file extension if present
  if (sanitized.length > maxLength) {
    const lastDotIndex = sanitized.lastIndexOf('.');
    if (lastDotIndex > 0 && lastDotIndex > sanitized.length - 10) {
      // Has extension, preserve it
      const extension = sanitized.substring(lastDotIndex);
      const nameWithoutExt = sanitized.substring(0, lastDotIndex);
      const maxNameLength = maxLength - extension.length;
      sanitized = nameWithoutExt.substring(0, maxNameLength) + extension;
    } else {
      // No extension or extension too long, just truncate
      sanitized = sanitized.substring(0, maxLength);
    }
  }

  return sanitized;
}

// Create fetch with timeout
function createFetchWithTimeout(timeoutMs: number = REQUEST_TIMEOUT) {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }
      throw error;
    }
  };
}

const fetchWithTimeout = createFetchWithTimeout();

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
    console.log("Making request to:", `${getSiteUrl()}/drive/root:/CLIENTS:/`);
    try {
      const clientsFolderResponse = await fetchWithTimeout(
        `${getSiteUrl()}/drive/root:/CLIENTS:/`,
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
          
          const createClientsFolderResponse = await fetchWithTimeout(
            `${getSiteUrl()}/drive/root:/CLIENTS:/`,
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
      `${getSiteUrl()}/drive/root:/CLIENTS/${folderName}:/`
    );
    const response = await fetchWithTimeout(
      `${getSiteUrl()}/drive/root:/CLIENTS/${folderName}:/`,
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
      const questionFolderRes = await fetchWithTimeout(
        `${getSiteUrl()}/drive/root:/CLIENTS/${clientFolderName}/${folderName}:/`,
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
        const subfolderRes = await fetchWithTimeout(
          `${getSiteUrl()}/drive/root:/CLIENTS/${clientFolderName}/${folderName}/${subfolder}:/`,
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
  // Validate inputs
  if (!sourceFileId || typeof sourceFileId !== 'string') {
    throw new Error('Invalid source file ID provided');
  }
  if (!loginKey || typeof loginKey !== 'string') {
    throw new Error('Invalid login key provided');
  }
  if (!clientName || typeof clientName !== 'string') {
    throw new Error('Invalid client name provided');
  }
  if (!destinationPath || typeof destinationPath !== 'string') {
    throw new Error('Invalid destination path provided');
  }

  return withSharePointRetry(async () => {
    console.log("Getting access token for file copy...");
    const accessToken = await getAccessToken();
    console.log("Access token received successfully");

    const sanitizedClientName = sanitizeSharePointName(clientName);
    const clientFolderName = `${sanitizedClientName}_${loginKey}`;
    const sanitizedDestinationPath = destinationPath.split('/').map(part => sanitizeSharePointName(part)).join('/');
    
    console.log("Client folder name for copy:", clientFolderName);
    console.log("Sanitized destination path:", sanitizedDestinationPath);

    // Ensure the path includes CLIENTS as the root folder
    const fullDestinationPath = `CLIENTS/${clientFolderName}/${sanitizedDestinationPath}`;
    console.log("Copying file to path:", fullDestinationPath);

    // Use Microsoft Graph copy API
    const parentPath = sanitizedDestinationPath.split("/").slice(0, -1).join("/");
    const fileName = sanitizedDestinationPath.split("/").pop();
    
    const response = await fetchWithTimeout(
      `${getSiteUrl()}/drive/items/${sourceFileId}/copy`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentReference: {
            driveId: "root",
            path: `/CLIENTS/${clientFolderName}${parentPath ? `/${parentPath}` : ''}`
          },
          name: fileName,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: error.message || `HTTP ${response.status}`,
        error
      };
    }

    const data = await response.json();
    console.log("File copied successfully with ID:", data.id);
    return data.id;
  }, "copy file to client folder");
}

export async function uploadFileToClientFolder(
  loginKey: string,
  clientName: string,
  filePath: string,
  fileContent: Blob
): Promise<string> {
  // Validate inputs
  if (!loginKey || typeof loginKey !== 'string') {
    throw new Error('Invalid login key provided');
  }
  if (!clientName || typeof clientName !== 'string') {
    throw new Error('Invalid client name provided');
  }
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path provided');
  }
  if (!fileContent || !(fileContent instanceof Blob)) {
    throw new Error('Invalid file content provided');
  }
  if (fileContent.size > MAX_FILE_SIZE) {
    throw new Error(`File size (${Math.round(fileContent.size / 1024 / 1024)}MB) exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  return withSharePointRetry(async () => {
    console.log("Getting access token for file upload...");
    const accessToken = await getAccessToken();
    console.log("Access token received successfully");

    const sanitizedClientName = sanitizeSharePointName(clientName);
    const clientFolderName = `${sanitizedClientName}_${loginKey}`;
    const sanitizedFilePath = filePath.split('/').map(part => sanitizeSharePointName(part)).join('/');
    
    console.log("Uploading file to client folder:", clientFolderName);
    console.log("Sanitized file path:", sanitizedFilePath);
    console.log("File size:", `${Math.round(fileContent.size / 1024)}KB`);

    // Choose upload method based on file size
    if (fileContent.size <= SMALL_FILE_THRESHOLD) {
      // Simple upload for small files
      return await uploadSmallFile(accessToken, clientFolderName, sanitizedFilePath, fileContent);
    } else {
      // Resumable upload for larger files
      return await uploadLargeFile(accessToken, clientFolderName, sanitizedFilePath, fileContent);
    }
  }, "upload file to client folder");
}

// Helper function for small file uploads
async function uploadSmallFile(
  accessToken: string,
  clientFolderName: string,
  filePath: string,
  fileContent: Blob
): Promise<string> {
  const response = await fetchWithTimeout(
    `${getSiteUrl()}/drive/root:/CLIENTS/${clientFolderName}/${filePath}:/content`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": fileContent.type || "application/octet-stream",
      },
      body: fileContent,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      message: error.message || `Upload failed: HTTP ${response.status}`,
      error
    };
  }

  const data = await response.json();
  console.log("Small file uploaded successfully with ID:", data.id);
  return data.id;
}

// Helper function for large file uploads using resumable upload sessions
async function uploadLargeFile(
  accessToken: string,
  clientFolderName: string,
  filePath: string,
  fileContent: Blob
): Promise<string> {
  console.log("Starting resumable upload session for large file...");
  
  // Create upload session
  const sessionResponse = await fetchWithTimeout(
    `${getSiteUrl()}/drive/root:/CLIENTS/${clientFolderName}/${filePath}:/createUploadSession`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        item: {
          "@microsoft.graph.conflictBehavior": "replace",
          name: filePath.split('/').pop()
        }
      }),
    }
  );

  if (!sessionResponse.ok) {
    const error = await sessionResponse.json().catch(() => ({}));
    throw {
      status: sessionResponse.status,
      message: error.message || `Failed to create upload session: HTTP ${sessionResponse.status}`,
      error
    };
  }

  const sessionData = await sessionResponse.json();
  const uploadUrl = sessionData.uploadUrl;
  
  console.log("Upload session created, uploading file chunks...");
  
  // Upload the file in chunks
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  const fileSize = fileContent.size;
  let uploadedBytes = 0;
  
  while (uploadedBytes < fileSize) {
    const chunkEnd = Math.min(uploadedBytes + chunkSize, fileSize);
    const chunk = fileContent.slice(uploadedBytes, chunkEnd);
    
    const chunkResponse = await fetchWithTimeout(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Range": `bytes ${uploadedBytes}-${chunkEnd - 1}/${fileSize}`,
        "Content-Length": chunk.size.toString(),
      },
      body: chunk,
    });

    if (!chunkResponse.ok && chunkResponse.status !== 202) {
      const error = await chunkResponse.json().catch(() => ({}));
      throw {
        status: chunkResponse.status,
        message: error.message || `Chunk upload failed: HTTP ${chunkResponse.status}`,
        error
      };
    }
    
    uploadedBytes = chunkEnd;
    const progress = Math.round((uploadedBytes / fileSize) * 100);
    console.log(`Upload progress: ${progress}% (${uploadedBytes}/${fileSize} bytes)`);
    
    // If this is the final chunk and upload is complete
    if (uploadedBytes === fileSize && chunkResponse.status === 201) {
      const data = await chunkResponse.json();
      console.log("Large file uploaded successfully with ID:", data.id);
      return data.id;
    }
  }
  
  throw new Error("Upload completed but no file ID returned");
}

export async function deleteFileFromOneDrive(
  loginKey: string,
  clientName: string,
  filePath: string
): Promise<void> {
  // Validate inputs
  if (!loginKey || typeof loginKey !== 'string') {
    throw new Error('Invalid login key provided');
  }
  if (!clientName || typeof clientName !== 'string') {
    throw new Error('Invalid client name provided');
  }
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path provided');
  }

  return withSharePointRetry(async () => {
    console.log("Getting access token for file deletion...");
    const accessToken = await getAccessToken();
    console.log("Access token received successfully");

    const sanitizedClientName = sanitizeSharePointName(clientName);
    const clientFolderName = `${sanitizedClientName}_${loginKey}`;
    const sanitizedFilePath = filePath.split('/').map(part => sanitizeSharePointName(part)).join('/');
    
    console.log("Deleting file from client folder:", clientFolderName);
    console.log("Sanitized file path:", sanitizedFilePath);

    const response = await fetchWithTimeout(
      `${getSiteUrl()}/drive/root:/CLIENTS/${clientFolderName}/${sanitizedFilePath}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("Delete response status:", response.status);

    // Don't throw error for 404 (file not found) - it's already deleted
    if (response.status === 404) {
      console.log("File/folder already deleted or doesn't exist");
      return;
    }

    if (!response.ok) {
      const error = await response.json().catch(async () => {
        const text = await response.text();
        return { message: text, code: response.status };
      });
      
      throw {
        status: response.status,
        message: error.message || error.code || `Delete failed: HTTP ${response.status}`,
        error
      };
    }

    console.log("File deleted successfully");
  }, "delete file from OneDrive");
}

export async function checkQuestionCompletion(
  loginKey: string,
  clientName: string,
  questions: Array<{ question: string }>
): Promise<{ [key: string]: boolean }> {
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
    const accessToken = await getAccessToken();
    const sanitizedClientName = sanitizeSharePointName(clientName);
    const clientFolderName = `${sanitizedClientName}_${loginKey}`;
    console.log(
      "Client folder name for checking completion:",
      clientFolderName
    );
    console.log("Using loginKey for completion check:", loginKey);

    const completionStatus: { [key: string]: boolean } = {};

    for (const question of questions) {
      if (!question.question || typeof question.question !== 'string') {
        console.warn('Skipping invalid question:', question);
        continue;
      }

      const sanitizedQuestion = sanitizeSharePointName(question.question);
      // Only check the answer subfolder
      const checkPath = `CLIENTS/${clientFolderName}/${sanitizedQuestion}/answer`;
      console.log(
        "Checking completion for path (answer subfolder):",
        checkPath
      );

      try {
        const response = await fetchWithTimeout(
          `${getSiteUrl()}/drive/root:/${checkPath}:/children`,
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
      } catch (error) {
        console.error(
          `Error checking completion for question "${question.question}":`,
          error
        );
        completionStatus[question.question] = false;
      }
    }

    return completionStatus;
  }, "check question completion");
}