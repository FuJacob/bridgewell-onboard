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
  questions: Question[],
  templateFiles?: { [key: string]: File }
): Promise<SaveTemplateResponse> {
  console.log("=== DEBUG: saveTemplate service called ===");
  console.log("templateName:", templateName);
  console.log("questions:", questions);
  console.log(
    "templateFiles keys:",
    templateFiles ? Object.keys(templateFiles) : "none"
  );

  if (templateFiles && Object.keys(templateFiles).length > 0) {
    // Send FormData if there are files
    console.log("Sending FormData with files");
    const formData = new FormData();
    formData.append("templateName", templateName);
    formData.append("questions", JSON.stringify(questions));

    // Add template files to FormData
    Object.entries(templateFiles).forEach(([key, file]) => {
      console.log(`Adding ${key}: ${file.name} (${file.size} bytes)`);
      formData.append(key, file);
    });

    const response = await fetch("/api/admin/save-template", {
      method: "POST",
      body: formData,
    });

    let data;
    const responseClone = response.clone();
    try {
      data = await response.json();
    } catch (jsonError) {
      // Handle cases where response is not JSON (like 413 Request Entity Too Large)
      const text = await responseClone.text();
      console.error("Non-JSON response received:", text);
      
      if (response.status === 413) {
        throw new Error("Template files are too large. Please reduce the total file size and try again.");
      } else if (response.status === 408) {
        throw new Error("Request timeout. Please try again with fewer files.");
      } else {
        throw new Error(`Server error (${response.status}): ${text || "Unknown error"}`);
      }
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to save template");
    }

    return data;
  } else {
    // Send JSON if no files
    console.log("Sending JSON without files");
    const response = await fetch("/api/admin/save-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateName, questions }),
    });

    let data;
    const responseClone = response.clone();
    try {
      data = await response.json();
    } catch (jsonError) {
      // Handle cases where response is not JSON
      const text = await responseClone.text();
      console.error("Non-JSON response received:", text);
      
      if (response.status === 413) {
        throw new Error("Template data is too large. Please reduce the template size and try again.");
      } else if (response.status === 408) {
        throw new Error("Request timeout. Please try again.");
      } else {
        throw new Error(`Server error (${response.status}): ${text || "Unknown error"}`);
      }
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to save template");
    }

    return data;
  }
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

/**
 * Update an existing template
 */
export async function updateTemplate(
  templateId: string,
  templateName: string,
  questions: Question[],
  templateFiles?: { [key: string]: File }
): Promise<SaveTemplateResponse> {
  console.log("=== DEBUG: updateTemplate service called ===");
  console.log("templateId:", templateId);
  console.log("templateName:", templateName);
  console.log("questions:", questions);
  console.log(
    "templateFiles keys:",
    templateFiles ? Object.keys(templateFiles) : "none"
  );

  if (templateFiles && Object.keys(templateFiles).length > 0) {
    // Send FormData if there are files
    console.log("Sending FormData with files");
    const formData = new FormData();
    formData.append("templateId", templateId);
    formData.append("templateName", templateName);
    formData.append("questions", JSON.stringify(questions));

    // Add template files to FormData
    Object.entries(templateFiles).forEach(([key, file]) => {
      console.log(`Adding ${key}: ${file.name} (${file.size} bytes)`);
      formData.append(key, file);
    });

    const response = await fetch("/api/admin/update-template", {
      method: "PUT",
      body: formData,
    });

    let data;
    const responseClone = response.clone();
    try {
      data = await response.json();
    } catch (jsonError) {
      // Handle cases where response is not JSON (like 413 Request Entity Too Large)
      const text = await responseClone.text();
      console.error("Non-JSON response received:", text);
      
      if (response.status === 413) {
        throw new Error("Template files are too large. Please reduce the total file size and try again.");
      } else if (response.status === 408) {
        throw new Error("Request timeout. Please try again with fewer files.");
      } else {
        throw new Error(`Server error (${response.status}): ${text || "Unknown error"}`);
      }
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to update template");
    }

    return data;
  } else {
    // Send JSON if no files
    console.log("Sending JSON without files");
    const response = await fetch("/api/admin/update-template", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, templateName, questions }),
    });

    let data;
    const responseClone = response.clone();
    try {
      data = await response.json();
    } catch (jsonError) {
      // Handle cases where response is not JSON
      const text = await responseClone.text();
      console.error("Non-JSON response received:", text);
      
      if (response.status === 413) {
        throw new Error("Template data is too large. Please reduce the template size and try again.");
      } else if (response.status === 408) {
        throw new Error("Request timeout. Please try again.");
      } else {
        throw new Error(`Server error (${response.status}): ${text || "Unknown error"}`);
      }
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to update template");
    }

    return data;
  }
}
