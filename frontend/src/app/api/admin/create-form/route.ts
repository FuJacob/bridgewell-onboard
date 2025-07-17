import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ClientInsert, QuestionInsert } from "@/types";
import {
  createClientFolder,
  createQuestionFolders,
  uploadFileToClientFolder,
  copyFileToClientFolder,
} from "@/app/utils/microsoft/graph";

export async function POST(request: Request) {
  try {
    // Accept FormData
    const formData = await request.formData();
    const clientName = formData.get("clientName") as string;
    const email = formData.get("email") as string;
    const organization = formData.get("organization") as string;
    const clientDescription = formData.get("clientDescription") as string;
    const questionsRaw = formData.get("questions") as string;
    console.log("Received form data:", {
      clientName,
      email,
      organization,
      clientDescription,
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

    if (
      !clientName ||
      !email ||
      !organization ||
      !clientDescription ||
      !questionsRaw
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const questions = JSON.parse(questionsRaw);
    console.log("Parsed questions:", JSON.stringify(questions, null, 2));

    // 3. Store the form data in Supabase
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
    const clientInsertData: ClientInsert = {
      email: email,
      client_name: clientName,
      organization: organization,
      description: clientDescription,
    };

    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .insert([clientInsertData])
      .select();

    if (clientError) {
      console.error("Supabase error creating form:", clientError);
      return NextResponse.json(
        { error: `Database error: ${clientError.message}` },
        { status: 500 }
      );
    }
    const loginKey = clientData[0].login_key;
    console.log("Generated loginKey:", loginKey);

    // Add login_key to each question to link them to the client
    const questionsWithLoginKey: QuestionInsert[] = questions.map(
      (question: QuestionInsert) => ({
        ...question,
        login_key: loginKey,
      })
    );

    const { error: questionsError } = await supabase
      .from("questions")
      .insert(questionsWithLoginKey)
      .select();

    if (questionsError) {
      console.error("Supabase error creating form:", questionsError);
      return NextResponse.json(
        { error: `Database error: ${questionsError.message}` },
        { status: 500 }
      );
    }

    console.log("Form data stored successfully in Supabase");
    // 1. Create OneDrive folders
    console.log("Creating OneDrive folders...");
    await createClientFolder(loginKey, clientName);
    await createQuestionFolders(loginKey, clientName, questions);

    // 2. Upload template files and update question metadata
    console.log("Starting template file uploads...");
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`Processing question ${i + 1}:`, question.question);
      console.log(`Question response_type:`, question.response_type);
      console.log(`Question templates:`, question.templates);

      if (
        question.response_type === "file" &&
        question.templates &&
        question.templates.length > 0
      ) {
        console.log(
          `Found ${question.templates.length} templates for question ${i + 1}`
        );
        const sanitizedQuestion = question.question
          .replace(/[^a-zA-Z0-9]/g, "_")
          .substring(0, 50);

        // Create a mutable copy of templates to avoid read-only property errors
        const mutableTemplates = [...question.templates];

        // Upload each template file
        for (
          let templateIdx = 0;
          templateIdx < mutableTemplates.length;
          templateIdx++
        ) {
          const fileKey = `templateFile_${i}_${templateIdx}`;
          const file = formData.get(fileKey) as File | null;
          console.log(`Looking for file with key: ${fileKey}`);
          console.log(
            `File found:`,
            file ? `Yes (${file.name}, ${file.size} bytes)` : "No"
          );

          if (file) {
            try {
              console.log(`Uploading file: ${file.name}`);
              const buffer = await file.arrayBuffer();
              const fileName = file.name;
              const fileId = await uploadFileToClientFolder(
                loginKey,
                clientName,
                `${sanitizedQuestion}/template/${fileName}`,
                new Blob([buffer], { type: file.type })
              );
              console.log(`File uploaded successfully with ID: ${fileId}`);
              mutableTemplates[templateIdx] = {
                fileName,
                fileId,
                uploadedAt: new Date().toISOString(),
              };
            } catch (uploadError) {
              console.error(`Error uploading file ${file.name}:`, uploadError);
              // Continue with other files even if one fails
              mutableTemplates[templateIdx] = {
                fileName: file.name,
                fileId: "",
                uploadedAt: new Date().toISOString(),
              };
            }
          } else {
            // No file found in FormData - check if this template already has a fileId
            const template = mutableTemplates[templateIdx];
            if (template.fileId && template.fileId.trim() !== "") {
              console.log(
                `Template ${templateIdx} already has fileId: ${template.fileId}, copying file...`
              );
              try {
                // Copy the file from the original location to the new client folder
                const newFileId = await copyFileToClientFolder(
                  template.fileId,
                  loginKey,
                  clientName,
                  `${sanitizedQuestion}/template/${template.fileName}`
                );
                console.log(
                  `File copied successfully with new ID: ${newFileId}`
                );
                mutableTemplates[templateIdx] = {
                  fileName: template.fileName,
                  fileId: newFileId,
                  uploadedAt: new Date().toISOString(),
                };
              } catch (copyError) {
                console.error(
                  `Error copying file ${template.fileName}:`,
                  copyError
                );
                // Keep the original fileId as fallback
                mutableTemplates[templateIdx] = {
                  fileName: template.fileName,
                  fileId: template.fileId,
                  uploadedAt: template.uploadedAt || new Date().toISOString(),
                };
              }
            } else {
              console.log(
                `No file found for key ${fileKey} and no existing fileId, skipping`
              );
            }
          }
        }

        // Update the question in the database with the new template fileIds
        console.log(
          `Updating question in database with templates:`,
          mutableTemplates
        );
        const { error: updateError } = await supabase
          .from("questions")
          .update({ templates: mutableTemplates })
          .eq("login_key", loginKey)
          .eq("question", question.question);

        if (updateError) {
          console.error("Error updating question templates:", updateError);
        } else {
          console.log("Question templates updated successfully in database");
        }
      } else {
        console.log(
          `Question ${i + 1} is not a file question or has no templates`
        );
      }
    }

    console.log("Form creation completed successfully");
    return NextResponse.json({
      message: "Form created successfully",
      loginKey,
    });
  } catch (error) {
    console.error("Error in create-form:", error);
    return NextResponse.json(
      {
        error: `Server error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
