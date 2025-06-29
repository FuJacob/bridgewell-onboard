import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createClientFolder,
  createQuestionFolders,
  uploadFileToClientFolder,
} from "@/app/utils/microsoft/graph";

export async function POST(request: Request) {
  try {
    // Accept FormData
    const formData = await request.formData();
    const clientName = formData.get("clientName") as string;
    const email = formData.get("email") as string;
    const organization = formData.get("organization") as string;
    const description = formData.get("clientDescription") as string;
    const questionsRaw = formData.get("questions") as string;
    if (!clientName || !email || !organization || !questionsRaw) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const questions = JSON.parse(questionsRaw);

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
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .insert([
        {
          email: email,
          client_name: clientName,
          organization: organization,
          description: description,
        },
      ])
      .select();

    if (clientError) {
      console.error("Supabase error creating form:", clientError);
      return NextResponse.json(
        { error: `Database error: ${clientError.message}` },
        { status: 500 }
      );
    }
    const loginKey = clientData[0].login_key;

    // Add login_key to each question to link them to the client
    const questionsWithLoginKey = questions.map((question: object) => ({
      ...question,
      login_key: loginKey,
    }));

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
    await createClientFolder(loginKey, clientName);
    await createQuestionFolders(loginKey, clientName, questions);

    // 2. Upload template files and update question metadata
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (
        question.response_type === "file" &&
        question.templates &&
        question.templates.length > 0
      ) {
        const sanitizedQuestion = question.question
          .replace(/[^a-zA-Z0-9]/g, "_")
          .substring(0, 50);

        // Upload each template file
        for (
          let templateIdx = 0;
          templateIdx < question.templates.length;
          templateIdx++
        ) {
          const file = formData.get(
            `templateFile_${i}_${templateIdx}`
          ) as File | null;
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

        // Update the question in the database with the new template fileIds
        const { error: updateError } = await supabase
          .from("questions")
          .update({ templates: question.templates })
          .eq("login_key", loginKey)
          .eq("question", question.question);

        if (updateError) {
          console.error("Error updating question templates:", updateError);
        }
      }
    }

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
