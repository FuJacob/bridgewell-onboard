import { NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";
import { TemplateQuestion } from "@/types";
import { createQuestionFolders } from "@/app/utils/microsoft/graph";

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

    const questions = JSON.parse(questionsRaw);
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

    // Get existing questions to compare with new ones
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

    // Identify which questions have been deleted (need to clear client data)
    const deletedQuestionIndices = [];
    const existingQuestionsMap = new Map();

    existingQuestions?.forEach((q, index) => {
      existingQuestionsMap.set(index, q);
    });

    // Mark questions that were removed as deleted (these need cleanup)
    for (let i = questions.length; i < (existingQuestions?.length || 0); i++) {
      deletedQuestionIndices.push(i);
    }

    console.log("Deleted question indices:", deletedQuestionIndices);

    // Clear client submissions for DELETED questions only
    if (deletedQuestionIndices.length > 0) {
      console.log("Clearing client submissions for deleted questions...");

      // Note: Submissions are tracked via SharePoint file existence, not database records
      console.log("Skipping submission cleanup - submissions tracked via SharePoint files");
      // In this system, when questions are deleted, the corresponding SharePoint files
      // should be removed as part of the SharePoint cleanup process.

      // Clear OneDrive files for deleted questions (recursive leaf-first)
      console.log("Clearing OneDrive files for deleted questions...");
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

        for (const questionIndex of deletedQuestionIndices) {
          const existingQuestion = existingQuestionsMap.get(questionIndex);
          if (existingQuestion && existingQuestion.question) {
            const sanitizedQuestion = (existingQuestion.question as string)
              .replace(/[^a-zA-Z0-9]/g, "_")
              .substring(0, 50);
            const questionPath = `CLIENTS/${clientFolderName}/${sanitizedQuestion}`;
            try {
              await deleteRecursivelyByPath(questionPath);
              // attempt to delete the now-empty question folder
              await fetch(`${SITE_URL}/drive/root:/${questionPath}:`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
              console.log(`Deleted OneDrive folder for question ${questionIndex}: ${sanitizedQuestion}`);
            } catch (err) {
              console.error(`Error deleting OneDrive folder for question ${questionIndex}:`, err);
            }
          }
        }
      } catch (importError) {
        console.error("Error during recursive OneDrive question cleanup:", importError);
      }
    }

    // Upsert questions individually
    console.log("Upserting questions...");
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const existingQuestion = existingQuestionsMap.get(i);

      if (existingQuestion) {
        // Update existing question - exclude ID to avoid conflicts
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...questionDataWithoutId } = question;
        const updateData = {
          ...questionDataWithoutId,
          login_key: loginKey,
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
      }
    }

    // Delete questions that were removed
    for (let i = questions.length; i < (existingQuestions?.length || 0); i++) {
      const existingQuestion = existingQuestionsMap.get(i);
      if (existingQuestion) {
        const { error: deleteError } = await supabase
          .from("questions")
          .delete()
          .eq("id", existingQuestion.id);

        if (deleteError) {
          console.error(`Error deleting question ${i}:`, deleteError);
          return NextResponse.json(
            {
              error: `Database error deleting question ${i}: ${deleteError.message}`,
            },
            { status: 500 }
          );
        }
      }
    }

    console.log("Form questions updated successfully in Supabase");

    // Update OneDrive folders for new questions
    console.log("Updating OneDrive folders...");
    await createQuestionFolders(loginKey, clientName || 'unknown_client', questions);

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
