import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Question } from "@/types";
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
    questions.forEach((question: any, index: number) => {
      if (question.templates && typeof question.templates === 'string') {
        try {
          question.templates = JSON.parse(question.templates);
          console.log(`Question ${index + 1}: Parsed ${question.templates.length} templates from JSON string`);
        } catch (parseError) {
          console.error(`Error parsing templates for question ${index + 1}:`, parseError);
          question.templates = null;
        }
      }
    });

    // 3. Update the form data in Supabase
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

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

    // Identify which questions have been modified
    const modifiedQuestionIndices = [];
    const existingQuestionsMap = new Map();

    existingQuestions?.forEach((q, index) => {
      existingQuestionsMap.set(index, q);
    });

    questions.forEach((newQuestion: Question, index: number) => {
      const existingQuestion = existingQuestionsMap.get(index);
      if (
        !existingQuestion ||
        existingQuestion.question !== newQuestion.question ||
        existingQuestion.description !== newQuestion.description ||
        existingQuestion.response_type !== newQuestion.response_type ||
        existingQuestion.due_date !== newQuestion.due_date ||
        existingQuestion.link !== newQuestion.link
      ) {
        modifiedQuestionIndices.push(index);
      }
    });

    // Also mark questions that were removed as modified
    for (let i = questions.length; i < (existingQuestions?.length || 0); i++) {
      modifiedQuestionIndices.push(i);
    }

    console.log("Modified question indices:", modifiedQuestionIndices);

    // Clear client submissions for modified questions
    if (modifiedQuestionIndices.length > 0) {
      console.log("Clearing client submissions for modified questions...");

      // Get all client submissions for this login key
      const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select("responses")
        .eq("login_key", loginKey);

      if (submissionsError) {
        console.error("Error fetching submissions:", submissionsError);
      } else if (submissions && submissions.length > 0) {
        // Update each submission to remove responses for modified questions
        for (const submission of submissions) {
          if (submission.responses) {
            const responses = JSON.parse(submission.responses);
            const updatedResponses = { ...responses };

            // Remove responses for modified questions
            modifiedQuestionIndices.forEach((index) => {
              delete updatedResponses[index.toString()];
            });

            // Update the submission with cleaned responses
            const { error: updateSubmissionError } = await supabase
              .from("submissions")
              .update({ responses: JSON.stringify(updatedResponses) })
              .eq("login_key", loginKey)
              .eq("responses", submission.responses);

            if (updateSubmissionError) {
              console.error(
                "Error updating submission:",
                updateSubmissionError
              );
            }
          }
        }
      }

      // Clear OneDrive files for modified questions
      console.log("Clearing OneDrive files for modified questions...");
      try {
        // Import the delete function from Microsoft Graph utilities
        const { deleteFileFromOneDrive } = await import(
          "@/app/utils/microsoft/graph"
        );

        for (const questionIndex of modifiedQuestionIndices) {
          const existingQuestion = existingQuestionsMap.get(questionIndex);
          if (existingQuestion) {
            const sanitizedQuestion = existingQuestion.question
              .replace(/[^a-zA-Z0-9]/g, "_")
              .substring(0, 50);

            // Delete the entire question folder from OneDrive
            try {
              await deleteFileFromOneDrive(
                loginKey,
                clientName,
                `${sanitizedQuestion}/`
              );
              console.log(
                `Deleted OneDrive folder for question ${questionIndex}: ${sanitizedQuestion}`
              );
            } catch (deleteError) {
              console.error(
                `Error deleting OneDrive folder for question ${questionIndex}:`,
                deleteError
              );
              // Continue with other deletions even if one fails
            }
          }
        }
      } catch (importError) {
        console.error("Error importing deleteFileFromOneDrive:", importError);
      }
    }

    // Upsert questions individually
    console.log("Upserting questions...");
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const existingQuestion = existingQuestionsMap.get(i);

      // Prepare question data with login_key
      const questionData = {
        ...question,
        login_key: loginKey,
      };

      if (existingQuestion) {
        // Update existing question
        const { error: updateError } = await supabase
          .from("questions")
          .update(questionData)
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
        // Insert new question
        const { error: insertError } = await supabase
          .from("questions")
          .insert(questionData);

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
    await createQuestionFolders(loginKey, clientName, questions);

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
