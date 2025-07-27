// Admin-related API services
import { 
  Question, 
  APIResponse, 
  validateLoginKey, 
  validateClientName,
  validateEmail 
} from "@/types";

export interface CreateFormResponse {
  loginKey?: string;
  error?: string;
}

/**
 * Delete a client and their associated data
 */
export async function deleteClient(
  loginKey: string,
  clientName: string
): Promise<{ message?: string; status: number }> {
  // Validate inputs
  if (!loginKey) {
    throw new Error("Login key is required");
  }

  const loginKeyValidation = validateLoginKey(loginKey);
  if (!loginKeyValidation.isValid) {
    throw new Error(loginKeyValidation.errors.join(", "));
  }

  if (!clientName) {
    throw new Error("Client name is required");
  }

  const clientNameValidation = validateClientName(clientName);
  if (!clientNameValidation.isValid) {
    throw new Error(clientNameValidation.errors.join(", "));
  }

  const response = await fetch(`/api/admin/delete-client`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ loginKey, clientName }),
  });

  const result: APIResponse = await response.json().catch(() => ({
    error: "Network error",
    success: false
  }));

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to delete client");
  }

  return { message: "Client deleted successfully", status: response.status };
}

/**
 * Create a new client form
 */
export async function createForm(
  clientName: string,
  email: string,
  organization: string,
  clientDescription: string,
  questions: Question[],
  templateFiles: { [key: string]: File } = {}
): Promise<{ loginKey?: string; error?: string }> {
  // Validate inputs
  if (!clientName) {
    return { error: "Client name is required" };
  }

  const clientNameValidation = validateClientName(clientName);
  if (!clientNameValidation.isValid) {
    return { error: clientNameValidation.errors.join(", ") };
  }

  if (!email) {
    return { error: "Email is required" };
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return { error: emailValidation.errors.join(", ") };
  }

  if (!organization || organization.trim().length === 0) {
    return { error: "Organization is required" };
  }

  if (!clientDescription || clientDescription.trim().length === 0) {
    return { error: "Client description is required" };
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return { error: "At least one question is required" };
  }

  // Validate file sizes
  const totalSize = Object.values(templateFiles).reduce((sum, file) => sum + file.size, 0);
  if (totalSize > 100 * 1024 * 1024) { // 100MB total limit
    return { error: "Total file size must be less than 100MB" };
  }

  const formData = new FormData();
  formData.append("clientName", clientName);
  formData.append("email", email);
  formData.append("organization", organization);
  formData.append("clientDescription", clientDescription);
  formData.append("questions", JSON.stringify(questions));

  // Add template files to FormData with detailed logging
  console.log(`=== Adding ${Object.keys(templateFiles).length} files to FormData ===`);
  Object.entries(templateFiles).forEach(([key, file]) => {
    console.log(`Adding to FormData: ${key} -> ${file.name} (${file.size} bytes)`);
    formData.append(key, file);
  });

  const response = await fetch("/api/admin/create-form", {
    method: "POST",
    body: formData,
  });

  let data: APIResponse<{ loginKey: string; uploadSummary: any }>;
  try {
    data = await response.json();
  } catch {
    // Handle cases where response is not JSON (like 413 Request Entity Too Large)
    const text = await response.text().catch(() => "Unknown error");
    console.error("Non-JSON response received:", text);
    
    if (response.status === 413) {
      return { error: "Files are too large. Please reduce the total file size and try again." };
    } else if (response.status === 408) {
      return { error: "Request timeout. Please try again with fewer files." };
    } else {
      return { error: `Server error (${response.status}): ${text}` };
    }
  }

  if (!response.ok || !data.success) {
    return { error: data.error || "Failed to create form" };
  }

  if (!data.data?.loginKey) {
    return { error: "Invalid response from server" };
  }

  return { loginKey: data.data.loginKey };
}

/**
 * Update an existing client form
 */
export async function updateForm(
  loginKey: string,
  questions: Question[],
  templateFiles: { [key: string]: File } = {}
): Promise<{ success?: boolean; error?: string }> {
  const formData = new FormData();
  formData.append("loginKey", loginKey);
  formData.append("questions", JSON.stringify(questions));

  // Add template files to FormData with detailed logging
  console.log(`=== Adding ${Object.keys(templateFiles).length} files to FormData for update ===`);
  Object.entries(templateFiles).forEach(([key, file]) => {
    console.log(`Adding to FormData: ${key} -> ${file.name} (${file.size} bytes)`);
    formData.append(key, file);
  });
  
  // Verify files were added to FormData
  console.log("=== FormData verification for update ===");
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`FormData contains: ${key} -> ${value.name} (${value.size} bytes)`);
    }
  }
  console.log("=== End FormData verification ===");

  const response = await fetch("/api/admin/update-form", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    return { error: data.error || "Failed to update form" };
  }

  return { success: true };
}

/**
 * Redo/reset a specific question for a client
 */
export async function redoQuestion(
  loginKey: string,
  name: string,
  question: string
): Promise<{ success: boolean }> {
  const response = await fetch(`/api/admin/redo-question`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      loginKey,
      name,
      question,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to redo question");
  }

  return data;
}
