// Client-related API services
import { ClientData, SubmissionData } from "@/types";

/**
 * Validate a client login key
 */
export async function validateClientKey(key: string): Promise<void> {
  const response = await fetch(
    `/api/client/validate-key?key=${encodeURIComponent(key)}`
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Invalid login key");
  }
}

/**
 * Fetch client form data by login key
 */
export async function getClientFormData(loginKey: string): Promise<ClientData> {
  const response = await fetch(
    `/api/client/form-data?key=${encodeURIComponent(loginKey)}`
  );

  if (!response.ok) {
    throw new Error("Invalid key or form not found");
  }

  return response.json();
}

/**
 * Check submission status for a client
 */
export async function getClientSubmissions(
  loginKey: string
): Promise<SubmissionData> {
  console.log("Getting client submissions for login key:", loginKey);
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
): Promise<{ fileId?: string }> {
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

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.error || "Failed to submit response");
  }

  return responseData;
}
