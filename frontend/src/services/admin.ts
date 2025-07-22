// Admin-related API services
import { Question } from "@/types";

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
  const response = await fetch(`/api/admin/delete-client`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ loginKey, clientName }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to delete client");
  }

  return { ...result, status: response.status };
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
  
  // Verify files were added to FormData
  console.log("=== FormData verification ===");
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`FormData contains: ${key} -> ${value.name} (${value.size} bytes)`);
    }
  }
  console.log("=== End FormData verification ===");

  const response = await fetch("/api/admin/create-form", {
    method: "POST",
    body: formData,
  });

  let data;
  const responseClone = response.clone();
  try {
    data = await response.json();
  } catch {
    // Handle cases where response is not JSON (like 413 Request Entity Too Large)
    const text = await responseClone.text();
    console.error("Non-JSON response received:", text);
    
    if (response.status === 413) {
      return { error: "Files are too large. Please reduce the total file size and try again." };
    } else if (response.status === 408) {
      return { error: "Request timeout. Please try again with fewer files." };
    } else {
      return { error: `Server error (${response.status}): ${text || "Unknown error"}` };
    }
  }

  if (!response.ok) {
    return { error: data.error || "Failed to create form" };
  }

  return { loginKey: data.loginKey };
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
