// Client-related API services
import { ClientData, SubmissionData, APIResponse, validateLoginKey } from "@/types";

/**
 * Validate a client login key
 */
export async function validateClientKey(key: string): Promise<void> {
  if (!key) {
    throw new Error("Login key is required");
  }

  const validation = validateLoginKey(key);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(", "));
  }

  const response = await fetch(
    `/api/client/validate-key?key=${encodeURIComponent(key)}`
  );

  if (!response.ok) {
    const data: APIResponse = await response.json().catch(() => ({ 
      error: "Network error", 
      success: false 
    }));
    throw new Error(data.error || "Invalid login key");
  }
}

/**
 * Fetch client form data by login key
 */
export async function getClientFormData(loginKey: string): Promise<ClientData> {
  if (!loginKey) {
    throw new Error("Login key is required");
  }

  const validation = validateLoginKey(loginKey);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(", "));
  }

  const response = await fetch(
    `/api/client/form-data?key=${encodeURIComponent(loginKey)}`
  );

  if (!response.ok) {
    const data: APIResponse = await response.json().catch(() => ({ 
      error: "Network error", 
      success: false 
    }));
    throw new Error(data.error || "Invalid key or form not found");
  }

  const result: APIResponse<ClientData> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to fetch form data");
  }

  return result.data;
}

/**
 * Check submission status for a client
 */
export async function getClientSubmissions(
  loginKey: string
): Promise<SubmissionData> {
  const response = await fetch(
    `/api/client/submissions?key=${encodeURIComponent(loginKey)}`
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to fetch submissions");
  }

  return response.json();
}

/**
 * Submit a question response (text or file)
 */
export async function submitQuestionResponse(
  loginKey: string,
  questionIndex: number,
  questionText: string,
  response_type: string,
  textResponse?: string,
  file?: File
): Promise<{ fileId: string }> {
  // Validate inputs
  if (!loginKey) {
    throw new Error("Login key is required");
  }

  const validation = validateLoginKey(loginKey);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(", "));
  }

  if (!questionText || questionText.trim().length === 0) {
    throw new Error("Question text is required");
  }

  if (!response_type || !["text", "file"].includes(response_type)) {
    throw new Error("Invalid response type");
  }

  if (response_type === "text" && (!textResponse || textResponse.trim().length === 0)) {
    throw new Error("Text response is required for text responses");
  }

  if (response_type === "file" && !file) {
    throw new Error("File is required for file responses");
  }

  // Validate file if provided
  if (file) {
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error("File size must be less than 50MB");
    }
  }

  const formData = new FormData();
  formData.append("loginKey", loginKey);
  formData.append("questionIndex", questionIndex.toString());
  formData.append("questionText", questionText);
  formData.append("response_type", response_type);

  if (response_type === "text" && textResponse) {
    formData.append("textResponse", textResponse);
  } else if (response_type === "file" && file) {
    formData.append("file", file);
  }

  const response = await fetch("/api/client/submit-question", {
    method: "POST",
    body: formData,
  });

  const result: APIResponse<{ fileId: string }> = await response.json().catch(() => ({
    error: "Network error",
    success: false
  }));

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to submit response");
  }

  if (!result.data?.fileId) {
    throw new Error("Invalid response from server");
  }

  return result.data;
}
