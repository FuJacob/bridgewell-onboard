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
async function createUploadSession(params: {
  loginKey: string;
  clientName: string;
  questionText: string;
  folderType: 'answer' | 'template';
  filename: string;
}): Promise<string> {
  const resp = await fetch('/api/uploads/create-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await resp.json();
  if (!resp.ok || !data?.success || !data?.uploadUrl) {
    throw new Error(data?.error || 'Failed to create upload session');
  }
  return data.uploadUrl as string;
}

async function uploadInChunks(uploadUrl: string, file: File): Promise<{ driveItemId?: string }> {
  const chunkSize = 5 * 1024 * 1024; // 5MB
  let start = 0;
  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    const contentRange = `bytes ${start}-${end - 1}/${file.size}`;
    const resp = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': String(chunk.size),
        'Content-Range': contentRange,
      },
      body: chunk,
    });
    // Last chunk returns the driveItem
    if (!resp.ok && resp.status !== 202) {
      const t = await resp.text().catch(() => '');
      throw new Error(`Upload failed: ${resp.status} ${t}`);
    }
    if (end === file.size && resp.ok) {
      // try parse driveItem
      try {
        const j: any = await resp.json();
        const id = j?.id || j?.resourceId || j?.driveItem?.id;
        return { driveItemId: typeof id === 'string' ? id : undefined };
      } catch {
        return { driveItemId: undefined };
      }
    }
    start = end;
  }
  return { driveItemId: undefined };
}

async function finalizeUpload(params: { loginKey: string; questionText: string; mode: 'answer' | 'template'; fileName: string; fileId?: string }) {
  await fetch('/api/uploads/finalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }).catch(() => null);
}

export async function submitQuestionResponse(
  loginKey: string,
  clientName: string,
  questionIndex: number,
  questionText: string,
  response_type: string,
  textResponse?: string,
  files?: File[]
): Promise<{ fileIds: string[] }> {
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

  if (!response_type || !["text", "file", "notice"].includes(response_type)) {
    throw new Error("Invalid response type");
  }

  if (response_type === "text" && (!textResponse || textResponse.trim().length === 0)) {
    throw new Error("Text response is required for text responses");
  }

  if (response_type === "file" && (!files || files.length === 0)) {
    throw new Error("At least one file is required for file responses");
  }

  // No client-side file size/type validation

  // Text responses still go through the API to keep parity
  if (response_type === 'text') {
    const formData = new FormData();
    formData.append('loginKey', loginKey);
    formData.append('questionIndex', questionIndex.toString());
    formData.append('questionText', questionText);
    formData.append('response_type', response_type);
    if (textResponse) formData.append('textResponse', textResponse);
    const response = await fetch('/api/client/submit-question', { method: 'POST', body: formData });
    const result: APIResponse<{ fileIds: string[] }> = await response.json().catch(() => ({ error: 'Network error', success: false }));
    if (!response.ok || !result.success || !result.data?.fileIds) throw new Error(result.error || 'Failed to submit response');
    return result.data;
  }

  // File responses: direct upload to Graph
  const uploadedIds: string[] = [];
  for (const file of files || []) {
    const uploadUrl = await createUploadSession({
      loginKey,
      clientName,
      questionText,
      folderType: 'answer',
      filename: file.name,
    });
    const { driveItemId } = await uploadInChunks(uploadUrl, file);
    uploadedIds.push(driveItemId || '');
    await finalizeUpload({ loginKey, questionText, mode: 'answer', fileName: file.name, fileId: driveItemId });
  }
  return { fileIds: uploadedIds };
}
