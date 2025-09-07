import { NextResponse } from "next/server";
import { createServiceClient, handleDatabaseError, withRetry } from "@/app/utils/supabase/server";
import { 
  ClientInsert, 
  QuestionInsert, 
  TemplateQuestion,
  validateEmail,
  validateClientName,
  validateQuestionText,
  type APIResponse
} from "@/types";
import {
  createClientFolder,
  createQuestionFolders,
  uploadFileToClientFolder,
  copyFileToClientFolder,
  sanitizeSharePointName,
} from "@/app/utils/microsoft/graph";

// Configure route segment for large file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '0', // no explicit limit
    },
  },
};

export async function POST(request: Request): Promise<NextResponse<APIResponse<{ loginKey: string; uploadSummary: any }>>> {
  try {
    // Accept FormData
    const formData = await request.formData();
    const clientName = formData.get("clientName") as string;
    const email = formData.get("email") as string;
    const organization = formData.get("organization") as string;
    const clientDescription = formData.get("clientDescription") as string;
    const adminEmail = (formData.get("adminEmail") as string) || null;
    const questionsRaw = formData.get("questions") as string;
    
    console.log("Received form data:", {
      clientName,
      email,
      organization,
      clientDescription,
      questionsRaw,
    });

    // Validate required fields
    if (!clientName || !email || !organization || !clientDescription || !questionsRaw) {
      return NextResponse.json(
        { error: "Missing required fields", success: false },
        { status: 400 }
      );
    }

    // Validate individual fields
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.errors.join(", "), success: false },
        { status: 400 }
      );
    }

    const clientNameValidation = validateClientName(clientName);
    if (!clientNameValidation.isValid) {
      return NextResponse.json(
        { error: clientNameValidation.errors.join(", "), success: false },
        { status: 400 }
      );
    }
    // Parse and validate questions
    let questions: TemplateQuestion[];
    try {
      questions = JSON.parse(questionsRaw);
      if (!Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json(
          { error: "Questions must be a non-empty array", success: false },
          { status: 400 }
        );
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid questions format", success: false },
        { status: 400 }
      );
    }

    console.log("Parsed questions:", JSON.stringify(questions, null, 2));
    
    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.question && question.response_type !== 'notice') {
        return NextResponse.json(
          { error: `Question ${i + 1} is missing question text`, success: false },
          { status: 400 }
        );
      }

      const questionValidation = validateQuestionText(question.question);
      if (!questionValidation.isValid) {
        return NextResponse.json(
          { error: `Question ${i + 1}: ${questionValidation.errors.join(", ")}`, success: false },
          { status: 400 }
        );
      }

      if (!question.response_type || !["text", "file", "notice"].includes(question.response_type)) {
        return NextResponse.json(
          { error: `Question ${i + 1} has invalid response type`, success: false },
          { status: 400 }
        );
      }
    }
    
    // Parse templates from JSON strings back to arrays
    questions.forEach((question: TemplateQuestion, index: number) => {
      if (question.templates && typeof question.templates === 'string') {
        try {
          question.templates = JSON.parse(question.templates);
          console.log(`Question ${index + 1}: Parsed ${question.templates?.length || 0} templates from JSON string`);
        } catch (parseError) {
          console.error(`Error parsing templates for question ${index + 1}:`, parseError);
          question.templates = null;
        }
      }
    });

    // Store the form data in Supabase with retry logic
    const supabase = createServiceClient();
    const clientInsertData: ClientInsert = {
      email: email,
      client_name: clientName,
      organization: organization,
      description: clientDescription,
      admin: adminEmail,
    };

    const result = await withRetry(async () => {
      // Check for duplicate email
      const { data: existingClient, error: duplicateCheckError } = await supabase
        .from("clients")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (duplicateCheckError) {
        const dbError = handleDatabaseError(duplicateCheckError);
        throw new Error(`Error checking for duplicate email: ${dbError.message}`);
      }

      if (existingClient) {
        throw new Error("A client with this email already exists");
      }

      // Insert client
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert([clientInsertData])
        .select()
        .single();

      if (clientError) {
        const dbError = handleDatabaseError(clientError);
        throw new Error(`Database error creating client: ${dbError.message}`);
      }

      return clientData;
    });

    const loginKey = result.login_key;
    console.log("Generated loginKey:", loginKey);

    // Add login_key to each question to link them to the client
    const questionsWithLoginKey: QuestionInsert[] = questions.map(
      (question, idx) => ({
        question: question.question,
        description: question.description,
        response_type: question.response_type,
        due_date: question.due_date,
        link: question.link,
        login_key: loginKey,
        order: typeof (question as any).order === 'number' ? (question as any).order : idx + 1,
        templates: question.templates ? JSON.stringify(question.templates) : null,
      })
    );

    await withRetry(async () => {
      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionsWithLoginKey)
        .select();

      if (questionsError) {
        const dbError = handleDatabaseError(questionsError);
        throw new Error(`Database error creating questions: ${dbError.message}`);
      }
    });

    console.log("Form data stored successfully in Supabase");
    // 1. Create OneDrive folders
    console.log("Creating OneDrive folders...");
    await createClientFolder(loginKey, clientName);
    await createQuestionFolders(loginKey, clientName, questions);

    // 2. Upload template files and update question metadata
    console.log("Starting template file uploads...");
    let totalFilesUploaded = 0;
    let totalFilesSkipped = 0;
    const uploadResults = [];
    
    // Pre-validate all file keys exist in FormData
    console.log("=== Pre-validation: Checking all expected files ===");
    const expectedFiles = [];
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (question.response_type === "file" && question.templates && question.templates.length > 0) {
        for (let templateIdx = 0; templateIdx < question.templates.length; templateIdx++) {
          const fileKey = `templateFile_${i}_${templateIdx}`;
          const hasFile = formData.has(fileKey);
          expectedFiles.push({
            questionIndex: i,
            templateIndex: templateIdx,
            fileKey,
            hasFile,
            templateData: question.templates[templateIdx]
          });
          console.log(`Expected file: ${fileKey} - Present: ${hasFile} - Template: ${JSON.stringify(question.templates[templateIdx])}`);
        }
      }
    }
    console.log(`Total expected files: ${expectedFiles.length}`);
    console.log(`Files present in FormData: ${expectedFiles.filter(f => f.hasFile).length}`);
    console.log("=== End pre-validation ===");
    
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
        console.log(`Templates for question ${i + 1}:`, question.templates);
        
        const sanitizedQuestion = sanitizeSharePointName(question.question);

        // Create a mutable copy of templates to avoid read-only property errors
        const mutableTemplates: (typeof question.templates[0] | null)[] = [...question.templates];
        
        console.log(`Processing ${mutableTemplates.length} templates for question ${i + 1}`);

        // Upload each template file with comprehensive validation
        console.log(`Starting upload for ${mutableTemplates.length} templates in question ${i + 1}`);
        for (
          let templateIdx = 0;
          templateIdx < mutableTemplates.length;
          templateIdx++
        ) {
          const fileKey = `templateFile_${i}_${templateIdx}`;
          const file = formData.get(fileKey) as File | null;
          const template = mutableTemplates[templateIdx];
          
          console.log(`Processing template ${templateIdx}:`, {
            fileKey,
            hasFile: !!file,
            templateData: template,
            fileInfo: file ? `${file.name} (${file.size} bytes)` : "No file"
          });

          if (file) {
            try {
              console.log(`Uploading file: ${file.name} (${file.size} bytes)`);
              const buffer = await file.arrayBuffer();
              const fileName = file.name;
              
              // Add timeout for individual file uploads (60 seconds)
              const uploadPromise = uploadFileToClientFolder(
                loginKey,
                clientName,
                `${sanitizedQuestion}/template/${fileName}`,
                new Blob([buffer], { type: file.type })
              );
              
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('File upload timeout after 60 seconds')), 60000);
              });
              
              const fileId = await Promise.race([uploadPromise, timeoutPromise]) as string;
              console.log(`File uploaded successfully with ID: ${fileId}`);
              mutableTemplates[templateIdx] = {
                fileName,
                fileId,
                uploadedAt: new Date().toISOString(),
              };
              totalFilesUploaded++;
              uploadResults.push({ file: fileName, status: 'success', fileId });
            } catch (uploadError) {
              console.error(`Error uploading file ${file.name}:`, uploadError);
              // Continue with other files even if one fails
              mutableTemplates[templateIdx] = {
                fileName: file.name,
                fileId: "",
                uploadedAt: new Date().toISOString(),
              };
              totalFilesSkipped++;
              uploadResults.push({ 
                file: file.name, 
                status: 'failed', 
                error: uploadError instanceof Error ? uploadError.message : 'Unknown error' 
              });
            }
          } else {
            // No file found in FormData - check if this template already has a fileId
            const template = mutableTemplates[templateIdx];
            if (template && template.fileId && template.fileId.trim() !== "") {
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
                `No file found for key ${fileKey} and no existing fileId`
              );
              // Check if template has valid data, if not mark for removal
              const template = mutableTemplates[templateIdx];
              if (!template || !template.fileName || template.fileName.trim() === "") {
                console.log(`Template ${templateIdx} has no valid data, marking for removal`);
                mutableTemplates[templateIdx] = null; // Mark for removal
              } else {
                console.log(`Template ${templateIdx} has existing data: ${template.fileName}`);
              }
              totalFilesSkipped++;
              uploadResults.push({ file: fileKey, status: 'not_found' });
            }
          }
        }

        // Filter out any invalid templates (null, or those without fileName or fileId)
        const validTemplates = mutableTemplates.filter((template) => {
          if (template === null || template === undefined) {
            console.log(`Filtering out null/undefined template`);
            return false;
          }
          
          const isValid = template.fileName && 
                         template.fileName.trim() !== "" &&
                         template.fileId && 
                         template.fileId.trim() !== "";
          if (!isValid) {
            console.log(`Filtering out invalid template:`, {
              fileName: template.fileName,
              fileId: template.fileId,
              hasFileName: !!template.fileName,
              hasFileId: !!template.fileId
            });
          }
          return isValid;
        });

        console.log(`Original templates count: ${mutableTemplates.length}, Valid templates count: ${validTemplates.length}`);
        
        // Log detailed comparison
        console.log("=== Template processing summary ===");
        mutableTemplates.forEach((template, idx) => {
          const isValid = validTemplates.find(vt => vt && vt.fileName === template?.fileName && vt.fileId === template?.fileId);
          console.log(`Template ${idx}: ${template ? `${template.fileName} (fileId: ${template.fileId})` : 'null'} -> ${isValid ? 'KEPT' : 'FILTERED OUT'}`);
        });
        console.log("=== End template processing summary ===");
        
        // Update the question in the database with the new template fileIds
        console.log(
          `Updating question ${i + 1} in database with ${validTemplates.length} valid templates:`,
          validTemplates
        );
        const { error: updateError } = await supabase
          .from("questions")
          .update({ templates: JSON.stringify(validTemplates) })
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

    console.log(`Upload summary: ${totalFilesUploaded} files uploaded, ${totalFilesSkipped} files skipped/failed`);
    console.log('Upload results:', uploadResults);
    console.log("Form creation completed successfully");
    
    return NextResponse.json({
      data: {
        loginKey,
        uploadSummary: {
          totalUploaded: totalFilesUploaded,
          totalSkipped: totalFilesSkipped,
          details: uploadResults
        }
      },
      success: true
    });

  } catch (error) {
    console.error("Error in create-form:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    let statusCode = 500;
    
    if (errorMessage.includes("duplicate email")) {
      statusCode = 409;
    } else if (errorMessage.includes("Database error")) {
      statusCode = 503;
    } else if (errorMessage.includes("validation failed")) {
      statusCode = 400;
    }

    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: statusCode }
    );
  }
}
