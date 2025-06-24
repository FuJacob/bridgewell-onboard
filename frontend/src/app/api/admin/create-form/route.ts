import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createClientFolder,
  createQuestionFolders,
  uploadFileToClientFolder,
} from "@/app/utils/microsoft/graph";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    // Accept FormData
    const formData = await request.formData();
    const clientName = formData.get("clientName") as string;
    const organization = formData.get("organization") as string;
    const questionsRaw = formData.get("questions") as string;
    if (!clientName || !organization || !questionsRaw) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const questions = JSON.parse(questionsRaw);

    // Always generate a new unique login key for the Supabase insert and OneDrive
    const loginKey = uuidv4();
    console.log("Generated login key for Supabase and OneDrive:", loginKey);

    // 1. Create OneDrive folders
    await createClientFolder(loginKey, clientName);
    await createQuestionFolders(loginKey, clientName, questions);

    // 2. Upload template files and update question metadata
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (question.responseType === "file" && question.templates && question.templates.length > 0) {
        const sanitizedQuestion = question.question
          .replace(/[^a-zA-Z0-9]/g, "_")
          .substring(0, 50);
        
        // Upload each template file
        for (let templateIdx = 0; templateIdx < question.templates.length; templateIdx++) {
          const file = formData.get(`templateFile_${i}_${templateIdx}`) as File | null;
          if (file) {
            const buffer = await file.arrayBuffer();
            const fileName = file.name;
            const fileId = await uploadFileToClientFolder(
              loginKey,
              clientName,
              `${sanitizedQuestion}/template/${fileName}`,
              new Blob([buffer], { type: file.type })
            );
            question.templates[templateIdx] = {
              fileName,
              fileId,
              uploadedAt: new Date().toISOString(),
            };
          }
        }
      }
    }

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
    const { error } = await supabase
      .from("clients")
      .insert([
        {
          client_name: clientName,
          organization: organization,
          questions: JSON.stringify(questions),
          login_key: loginKey,
        },
      ])
      .select();

    if (error) {
      console.error("Supabase error creating form:", error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    console.log("Form data stored successfully in Supabase");

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
