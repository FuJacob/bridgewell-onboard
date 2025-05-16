import { NextResponse } from "next/server";
import { uploadFileToClientFolder } from "@/app/utils/microsoft/graph";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const clientName = formData.get("clientName") as string;
    const question = formData.get("question") as string;
    const tempLoginKey = formData.get("tempLoginKey") as string;
    if (!file || !clientName || !question || !tempLoginKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const sanitizedQuestion = question.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const buffer = await file.arrayBuffer();
    const fileName = file.name;
    const fileId = await uploadFileToClientFolder(
      tempLoginKey,
      clientName,
      `${sanitizedQuestion}/template/${fileName}`,
      new Blob([buffer], { type: file.type })
    );
    return NextResponse.json({ fileId, fileName });
  } catch (err) {
    console.error("Error uploading template:", err);
    return NextResponse.json({ error: "Failed to upload template" }, { status: 500 });
  }
} 