import { NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";
import { TemplateQuestion } from "@/types";
import { createQuestionFolders, uploadFileToClientFolder, sanitizeSharePointName } from "@/app/utils/microsoft/graph";

export async function POST(request: Request) {
  try {
    // Accept FormData
    const formData = await request.formData();
    const loginKey = formData.get("loginKey") as string;
    const questionsRaw = formData.get("questions") as string;

    console.log("Received update form data:", {
      loginKey,
      questionsRaw,
    });

    // Debug: Log all FormData entries
    console.log("=== DEBUG: All FormData entries ===");
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(
          `${key}: File(${value.name}, ${value.size} bytes, ${value.type})`
        );
      } else {
        console.log(`${key}: ${value}`);
      }
    }
    console.log("=== END DEBUG ===");

    if (!loginKey || !questionsRaw) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let questions = JSON.parse(questionsRaw);
    console.log("Parsed questions:", JSON.stringify(questions, null, 2));

    // Parse templates from JSON strings back to arrays
    questions.forEach((question: TemplateQuestion, index: number) => {
      if (question.templates && typeof question.templates === "string") {
        try {
          question.templates = JSON.parse(question.templates);
          console.log(
            `Question ${index + 1}: Parsed ${
              question.templates?.length || 0
            } templates from JSON string`
          );
        } catch (parseError) {
          console.error(
            `Error parsing templates for question ${index + 1}:`,
            parseError
          );
          question.templates = null;
        }
      }
    });

    // 3. Update the form data in Supabase
    const supabase = createServiceClient();

    // First, get the existing client data to get the client name
    const { data: existingClient, error: clientFetchError } = await supabase
      .from("clients")
      .select("client_name")
      .eq("login_key", loginKey)
      .single();

    if (clientFetchError || !existingClient) {
      console.error("Error fetching existing client:", clientFetchError);
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clientName = existingClient.client_name;
    // Fetch existing questions and build map + deletions list
    const { data: existingQuestions, error: existingQuestionsError } =
      await supabase.from("questions").select("*").eq("login_key", loginKey);

    if (existingQuestionsError) {
      console.error(
        "Error fetching existing questions:",
        existingQuestionsError
      );
      return NextResponse.json(
        { error: `Database error: ${existingQuestionsError.message}` },
        { status: 500 }
      );
    }

    const existingQuestionsMap = new Map<number, any>();
    existingQuestions?.forEach((q, idx) => existingQuestionsMap.set(idx, q));

    // Compute deleted questions by ID (handles deletions in the middle)
    const existingById = new Map<number, any>();
    existingQuestions?.forEach((q) => existingById.set(q.id, q));
    const newIds = new Set<number>();
    questions.forEach((q: any) => {
      if (typeof q.id === 'number') newIds.add(q.id);
    });
    const deletedExistingQuestions = (existingQuestions || []).filter((q: any) => !newIds.has(q.id));
    // Handle renamed questions: delete old folder and create new folder
    try {
      const { getAccessToken } = await import("@/app/utils/microsoft/auth");
      const accessToken = await getAccessToken();
      const sanitizedClientName = sanitizeSharePointName(clientName || 'unknown_client');
      const clientFolderName = `${sanitizedClientName}_${loginKey}`;
      const SHAREPOINT_SITE_ID = "bridgewellfinancial.sharepoint.com,80def30d-85bd-4e18-969a-6346931d152d,deb319e5-cef4-4818-9ec3-805bedea8819";
      const SITE_URL = `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_SITE_ID}`;

      const listChildrenByPath = async (path: string) => {
        let url: string | null = `${SITE_URL}/drive/root:/${path}:/children`;
        const results: Array<{ id: string; name: string; folder?: unknown }> = [];
        while (url) {
          const r: Response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
          if (!r.ok) break;
          const p: { value?: Array<{ id: string; name: string; folder?: unknown }>; [k: string]: unknown } = await r.json();
          (p.value || []).forEach((x) => results.push(x));
          const nl = (p as Record<string, unknown>)["@odata.nextLink"];
          url = typeof nl === 'string' ? nl : null;
        }
        return results;
      };

      const deleteRecursivelyByPath = async (path: string) => {
        const children = await listChildrenByPath(path);
        for (const child of children) {
          if (child.folder) {
            await deleteRecursivelyByPath(`${path}/${child.name}`);
            await fetch(`${SITE_URL}/drive/items/${child.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
          } else {
            await fetch(`${SITE_URL}/drive/items/${child.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
          }
        }
        // try delete the now-empty folder itself
        await fetch(`${SITE_URL}/drive/root:/${path}:`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
      };

      const renamedQuestions: Array<{ oldSanitized: string; newSanitized: string; newQuestion: string }> = [];
      // Prefer matching by id to avoid index-based drift
      for (let i = 0; i < questions.length; i++) {
        const newQ = questions[i] as any;
        const oldQ = (existingQuestions || []).find((q: any) => q.id === newQ?.id) || existingQuestionsMap.get(i);
        if (oldQ && typeof oldQ.question === 'string' && newQ && typeof newQ.question === 'string') {
          const oldSan = oldQ.question.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
          const newSan = newQ.question.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
          if (oldSan !== newSan) {
            renamedQuestions.push({ oldSanitized: oldSan, newSanitized: newSan, newQuestion: newQ.question });
          }
        }
      }

      for (const rq of renamedQuestions) {
        const oldPath = `CLIENTS/${clientFolderName}/${rq.oldSanitized}`;
        try {
          await deleteRecursivelyByPath(oldPath);
        } catch (e) {
          console.error('Failed deleting old question folder (rename):', oldPath, e);
        }
        // Create new folder and subfolders for the renamed question
        try {
          await createQuestionFolders(loginKey, clientName || 'unknown_client', [{ question: rq.newQuestion }]);
        } catch (e) {
          console.error('Failed creating folder for renamed question:', rq.newQuestion, e);
        }
      }
    } catch (e) {
      console.error('Rename handling failed:', e);
    }

    // Upload any new template files for file questions (now that clientName is known)
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const sanitizedQuestion = sanitizeSharePointName(q.question || '');

      // If templates array is empty for a file question and no incoming files for this index,
      // interpret as a request to clear the template subfolder contents.
      const anyIncomingForIndex = Array.from(formData.keys()).some((k) => k.startsWith(`templateFile_${i}_`));
      if (q.response_type === "file" && Array.isArray(q.templates) && q.templates.length === 0 && !anyIncomingForIndex) {
        try {
          const { getAccessToken } = await import("@/app/utils/microsoft/auth");
          const accessToken = await getAccessToken();
          const sanitizedClientName = sanitizeSharePointName(clientName || 'unknown_client');
          const clientFolderName = `${sanitizedClientName}_${loginKey}`;
          const SHAREPOINT_SITE_ID = "bridgewellfinancial.sharepoint.com,80def30d-85bd-4e18-969a-6346931d152d,deb319e5-cef4-4818-9ec3-805bedea8819";
          const SITE_URL = `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_SITE_ID}`;
          const templatePath = `CLIENTS/${clientFolderName}/${sanitizedQuestion}/template`;

          const listChildrenByPath = async (path: string) => {
            let url: string | null = `${SITE_URL}/drive/root:/${path}:/children`;
            const results: Array<{ id: string; name: string; folder?: unknown }> = [];
            while (url) {
              const r: Response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
              if (!r.ok) break;
              const p: { value?: Array<{ id: string; name: string; folder?: unknown }>; [k: string]: unknown } = await r.json();
              (p.value || []).forEach((x) => results.push(x));
              const nl = (p as Record<string, unknown>)["@odata.nextLink"];
              url = typeof nl === 'string' ? nl : null;
            }
            return results;
          };

          const deleteRecursivelyByPath = async (path: string) => {
            const children = await listChildrenByPath(path);
            for (const child of children) {
              if (child.folder) {
                await deleteRecursivelyByPath(`${path}/${child.name}`);
                await fetch(`${SITE_URL}/drive/items/${child.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
              } else {
                await fetch(`${SITE_URL}/drive/items/${child.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
              }
            }
          };

          await deleteRecursivelyByPath(templatePath);
        } catch (e) {
          console.error('Failed clearing template subfolder:', e);
        }
      }

      if (q.response_type === "file" && q.templates && q.templates.length > 0) {
        const updatedTemplates = [] as any[];
        for (let templateIdx = 0; templateIdx < q.templates.length; templateIdx++) {
          const fileKey = `templateFile_${i}_${templateIdx}`;
          const file = formData.get(fileKey) as File | null;
          const existing = q.templates[templateIdx];
          if (file) {
            const buffer = await file.arrayBuffer();
            const fileId = await uploadFileToClientFolder(
              loginKey,
              clientName || 'unknown_client',
              `${sanitizedQuestion}/template/${file.name}`,
              new Blob([buffer], { type: file.type })
            );
            updatedTemplates.push({ fileName: file.name, fileId, uploadedAt: new Date().toISOString() });
          } else {
            updatedTemplates.push({
              fileName: existing.fileName,
              fileId: existing.fileId || "",
              uploadedAt: existing.uploadedAt || new Date().toISOString(),
            });
          }
        }
        questions[i] = { ...q, templates: updatedTemplates };
      }
    }

    // existingQuestions and maps declared above

    // Clear OneDrive files for DELETED questions (by ID), then delete DB rows
    if (deletedExistingQuestions.length > 0) {
      console.log("Clearing OneDrive folders for deleted questions (by ID)...");
      try {
        const { getAccessToken } = await import("@/app/utils/microsoft/auth");
        const { sanitizeSharePointName } = await import("@/app/utils/microsoft/graph");
        const accessToken = await getAccessToken();
        const sanitizedClientName = sanitizeSharePointName(clientName || 'unknown_client');
        const clientFolderName = `${sanitizedClientName}_${loginKey}`;
        const SHAREPOINT_SITE_ID = "bridgewellfinancial.sharepoint.com,80def30d-85bd-4e18-969a-6346931d152d,deb319e5-cef4-4818-9ec3-805bedea8819";
        const SITE_URL = `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_SITE_ID}`;

        const listChildrenByPath = async (path: string) => {
          let url: string | null = `${SITE_URL}/drive/root:/${path}:/children`;
          const results: Array<{ id: string; name: string; folder?: unknown }> = [];
          while (url) {
            const r: Response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
            if (!r.ok) break;
            const p: { value?: Array<{ id: string; name: string; folder?: unknown }>; [k: string]: unknown } = await r.json();
            (p.value || []).forEach((x) => results.push(x));
            const nl = (p as Record<string, unknown>)["@odata.nextLink"];
            url = typeof nl === 'string' ? nl : null;
          }
          return results;
        };

        const deleteRecursivelyByPath = async (path: string) => {
          const children = await listChildrenByPath(path);
          for (const child of children) {
            if (child.folder) {
              await deleteRecursivelyByPath(`${path}/${child.name}`);
              await fetch(`${SITE_URL}/drive/items/${child.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
            } else {
              await fetch(`${SITE_URL}/drive/items/${child.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
            }
          }
        };

        for (const existingQuestion of deletedExistingQuestions) {
          if (existingQuestion && existingQuestion.question) {
            const sanitizedQuestion = (existingQuestion.question as string)
              .replace(/[^a-zA-Z0-9]/g, "_")
              .substring(0, 50);
            const questionPath = `CLIENTS/${clientFolderName}/${sanitizedQuestion}`;
            try {
              await deleteRecursivelyByPath(questionPath);
              // attempt to delete the now-empty question folder
              await fetch(`${SITE_URL}/drive/root:/${questionPath}:`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
              console.log(`Deleted OneDrive folder for question id ${existingQuestion.id}: ${sanitizedQuestion}`);
            } catch (err) {
              console.error(`Error deleting OneDrive folder for question id ${existingQuestion.id}:`, err);
            }
          }
        }
      } catch (importError) {
        console.error("Error during recursive OneDrive question cleanup:", importError);
      }
    }

    // Upsert questions individually
    console.log("Upserting questions...");
    const newQuestionTitlesForFolders: Array<{ question: string }> = [];
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i] as any;
      // Persist order; default to position if absent
      const orderValue = typeof question.order === 'number' ? question.order : (i + 1);
      question.order = orderValue;
      const existingQuestion = question.id
        ? (existingQuestions || []).find((q: any) => q.id === question.id)
        : existingQuestionsMap.get(i);

      if (existingQuestion) {
        // Update existing question - exclude ID to avoid conflicts
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...questionDataWithoutId } = question;
        const updateData = {
          ...questionDataWithoutId,
          login_key: loginKey,
          order: orderValue,
        };
        
        const { error: updateError } = await supabase
          .from("questions")
          .update(updateData)
          .eq("id", existingQuestion.id);

        if (updateError) {
          console.error(`Error updating question ${i}:`, updateError);
          return NextResponse.json(
            {
              error: `Database error updating question ${i}: ${updateError.message}`,
            },
            { status: 500 }
          );
        }
      } else {
        // Insert new question - exclude ID to let database generate it
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...questionDataWithoutId } = question;
        const insertData = {
          ...questionDataWithoutId,
          login_key: loginKey,
          order: orderValue,
        };
        
        const { error: insertError } = await supabase
          .from("questions")
          .insert(insertData);

        if (insertError) {
          console.error(`Error inserting question ${i}:`, insertError);
          return NextResponse.json(
            {
              error: `Database error inserting question ${i}: ${insertError.message}`,
            },
            { status: 500 }
          );
        }

        // Track new questions to create folders for them only
        if (typeof question.question === 'string' && question.question.trim().length > 0) {
          newQuestionTitlesForFolders.push({ question: question.question });
        }
      }
    }

    // Delete questions that were removed (by ID set)
    for (const removed of deletedExistingQuestions) {
      const { error: deleteError } = await supabase
        .from("questions")
        .delete()
        .eq("id", removed.id);

      if (deleteError) {
        console.error(`Error deleting question id ${removed.id}:`, deleteError);
        return NextResponse.json(
          {
            error: `Database error deleting question id ${removed.id}: ${deleteError.message}`,
          },
          { status: 500 }
        );
      }
    }

    console.log("Form questions updated successfully in Supabase");

    // Update OneDrive folders for NEW questions only to avoid renamed duplicates
    if (newQuestionTitlesForFolders.length > 0) {
      console.log("Creating OneDrive folders for new questions only...");
      await createQuestionFolders(loginKey, clientName || 'unknown_client', newQuestionTitlesForFolders);
    } else {
      console.log("No new questions to create folders for.");
    }

    console.log("Form updated successfully");

    return NextResponse.json({
      success: true,
      loginKey: loginKey,
      message: "Form updated successfully",
    });
  } catch (error) {
    console.error("Error updating form:", error);
    return NextResponse.json(
      { error: "Failed to update form" },
      { status: 500 }
    );
  }
}
