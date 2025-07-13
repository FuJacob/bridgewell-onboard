import { NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";
import { uploadFileToClientFolder } from "@/app/utils/microsoft/graph";
import { TemplateInsert, QuestionTemplate } from "@/types";

interface TemplateQuestion {
  question: string;
  description: string;
  response_type: string;
  due_date: string;
  templates?: Array<QuestionTemplate & {
    _needsUpload?: boolean;
    _file?: File;
    _fileKey?: string;
  }> | null;
  link?: string;
}

export async function POST(request: Request) {
  try {
    console.log("save-template API called");

    // Check if this is FormData (with files) or JSON
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData with files
      const formData = await request.formData();
      const templateName = formData.get("templateName") as string;
      const questionsRaw = formData.get("questions") as string;

      console.log("Received FormData - templateName:", templateName);
      console.log("Questions raw:", questionsRaw);

      if (!templateName || !questionsRaw) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      const questions = JSON.parse(questionsRaw) as TemplateQuestion[];
      console.log("Parsed questions:", questions);

      // Process questions and upload template files
      const processedQuestions = questions.map(
        (q: TemplateQuestion, idx: number) => {
          if (
            q.response_type === "file" &&
            q.templates &&
            q.templates.length > 0
          ) {
            return {
              ...q,
              templates: q.templates.map((template, templateIdx: number) => {
                const fileKey = `templateFile_${idx}_${templateIdx}`;
                const file = formData.get(fileKey) as File | null;

                if (file) {
                  // File exists in FormData - upload it
                  console.log(`Uploading template file: ${file.name}`);
                  return {
                    fileName: file.name,
                    fileId: "", // Will be updated after upload
                    uploadedAt: new Date().toISOString(),
                    _needsUpload: true,
                    _file: file,
                    _fileKey: fileKey,
                  };
                } else {
                  // No file in FormData - keep existing data
                  return {
                    fileName: template.fileName,
                    fileId: template.fileId || "",
                    uploadedAt: template.uploadedAt || new Date().toISOString(),
                  };
                }
              }),
            };
          }
          return q;
        }
      );

      // Upload files and update fileIds
      for (let i = 0; i < processedQuestions.length; i++) {
        const question = processedQuestions[i];
        if (question.response_type === "file" && question.templates) {
          for (
            let templateIdx = 0;
            templateIdx < question.templates.length;
            templateIdx++
          ) {
            const template = question.templates[templateIdx];
            if (template._needsUpload && template._file) {
              try {
                const sanitizedQuestion = (question.question || '')
                  .replace(/[^a-zA-Z0-9]/g, "_")
                  .substring(0, 50);

                const buffer = await template._file.arrayBuffer();
                const fileId = await uploadFileToClientFolder(
                  "TEMPLATE", // Use a special key for templates
                  "TEMPLATES",
                  `${sanitizedQuestion}/template/${template.fileName}`,
                  new Blob([buffer], { type: template._file.type })
                );

                console.log(`Template file uploaded with ID: ${fileId}`);
                template.fileId = fileId;
                delete template._needsUpload;
                delete template._file;
                delete template._fileKey;
              } catch (uploadError) {
                console.error(
                  `Error uploading template file ${template.fileName}:`,
                  uploadError
                );
                template.fileId = "";
                delete template._needsUpload;
                delete template._file;
                delete template._fileKey;
              }
            }
          }
        }
      }

      // Save to database
      const supabase = createServiceClient();
      const templateInsertData: TemplateInsert = {
        template_name: templateName,
        questions: JSON.stringify(processedQuestions),
      };
      
      const { data, error } = await supabase
        .from("templates")
        .insert([templateInsertData])
        .select();

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log("Template saved successfully:", data);
      return NextResponse.json({ success: true, data });
    } else {
      // Handle JSON request (existing behavior)
      const body = await request.json();
      console.log("Request body:", body);

      const { templateName, questions } = body;
      if (!templateName || !Array.isArray(questions)) {
        console.log(
          "Invalid input - templateName:",
          templateName,
          "questions:",
          questions
        );
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
      }

      console.log("Template name:", templateName);
      console.log("Questions array length:", questions.length);
      console.log("Questions to store:", questions);

      const supabase = createServiceClient();
      const templateInsertData: TemplateInsert = {
        template_name: templateName,
        questions: JSON.stringify(questions), // store as text
      };
      
      const { data, error } = await supabase
        .from("templates")
        .insert([templateInsertData])
        .select();

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log("Template saved successfully:", data);
      return NextResponse.json({ success: true, data });
    }
  } catch (err) {
    console.error("Server error in save-template:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
