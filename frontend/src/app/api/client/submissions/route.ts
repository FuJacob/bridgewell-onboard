import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/app/utils/supabase/server";
import { checkQuestionCompletion } from "@/app/utils/microsoft/graph";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const loginKey = searchParams.get("key");

  if (!loginKey) {
    return NextResponse.json(
      { error: "Login key is required" },
      { status: 400 }
    );
  }

  try {
    console.log("Checking submission status for key:", loginKey);
    // Use service client instead of regular client to avoid auth requirements
    const supabase = createServiceClient();

    // Get client data to verify login key and get questions
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("client_name")
      .eq("login_key", loginKey)
      .single();

    if (clientError || !clientData) {
      console.error("Error fetching client data:", clientError);
      return NextResponse.json({ error: "Invalid login key" }, { status: 400 });
    }

    // get questions
    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("login_key", loginKey);

    if (questionsError || !questionsData) {
      console.error("Error fetching questions:", questionsError);
      return NextResponse.json(
        { error: "Failed to fetch questions" },
        { status: 500 }
      );
    }
    const questions = questionsData;
    console.log("Questions:", questions);

    // Check OneDrive folder for completions
    // Filter out questions with null question text and transform to expected format
    const validQuestions = questions
      .filter(q => q.question !== null)
      .map(q => ({ question: q.question as string }));
    
    const completionStatus = await checkQuestionCompletion(
      loginKey,
      clientData.client_name || 'unknown_client',
      validQuestions
    );

    // Convert the completion status object to a responses-like format
    // where the key is the question index and the value indicates it's completed
    const responses: Record<string, { completed: boolean }> = {};
    validQuestions.forEach((question: { question: string }, index: number) => {
      if (completionStatus[question.question]) {
        responses[index] = { completed: true };
      }
    });

    return NextResponse.json({
      client_name: clientData.client_name,
      login_key: loginKey,
      responses,
    });
  } catch (error) {
    console.error("Error checking submissions:", error);
    return NextResponse.json(
      { error: "Failed to check submission status" },
      { status: 500 }
    );
  }
}
