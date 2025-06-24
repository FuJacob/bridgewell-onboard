// Admin-related API services
export interface FormData {
  id: string;
  client_name: string;
  organization: string;
  login_key: string;
  questions: string;
  created_at: string;
}

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
): Promise<{ message?: string }> {
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

  return result;
}

/**
 * Create a new form for a client
 */
interface QuestionTemplate {
  fileName?: string;
  fileId?: string;
  uploadedAt?: string;
  fileObject?: File;
}

interface Question {
  question: string;
  description?: string;
  responseType: string;
  dueDate?: string;
  templates?: QuestionTemplate[] | null;
}

export async function createForm(
  clientName: string,
  organization: string,
  questions: Question[],
  templateFiles?: { [key: string]: File }
): Promise<CreateFormResponse> {
  const formData = new FormData();
  formData.append("clientName", clientName);
  formData.append("organization", organization);

  // Add template files to FormData
  if (templateFiles) {
    Object.entries(templateFiles).forEach(([key, file]) => {
      formData.append(key, file);
    });
  }

  // Process questions and handle template files
  const processedQuestions = questions.map((q) => {
    if (q.responseType === "file" && q.templates && q.templates.length > 0) {
      return {
        ...q,
        templates: q.templates.map(template => ({
          fileName: template.fileObject?.name || template.fileName,
          fileId: template.fileId || "",
          uploadedAt: template.uploadedAt || new Date().toISOString(),
        }))
      };
    }
    return { ...q, templates: q.templates ? [...q.templates] : null };
  });

  formData.append("questions", JSON.stringify(processedQuestions));

  const response = await fetch("/api/admin/create-form", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create form");
  }

  return data;
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
