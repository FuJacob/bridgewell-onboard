// Template-related API services
import { Template, Question } from "@/types";

export interface SaveTemplateResponse {
  success: boolean;
  error?: string;
}

export interface GetTemplatesResponse {
  success: boolean;
  templates: Template[];
  error?: string;
}

/**
 * Save a new template
 */

export async function saveTemplate(
  templateName: string,
  questions: Question[]
): Promise<SaveTemplateResponse> {
  const response = await fetch("/api/admin/save-template", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateName, questions }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to save template");
  }

  return data;
}

/**
 * Get all available templates
 */
export async function getTemplates(): Promise<Template[]> {
  const response = await fetch("/api/admin/get-templates");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch templates");
  }

  return data.templates || [];
}

/**
 * Delete a template by ID
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  const response = await fetch("/api/admin/delete-template", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to delete template");
  }
}
