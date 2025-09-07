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
    // Sort by explicit order first, then id asc as tiebreaker
    const getOrder = (q: any) => {
      const o = q?.order;
      if (typeof o === 'number') return o;
      if (typeof o === 'string') {
        const n = parseInt(o, 10);
        return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
      }
      return Number.MAX_SAFE_INTEGER;
    };
    const questions = (questionsData || []).slice().sort((a: any, b: any) => {
      const ao = getOrder(a);
      const bo = getOrder(b);
      if (ao !== bo) return ao - bo;
      const aId = typeof a.id === 'number' ? a.id : 0;
      const bId = typeof b.id === 'number' ? b.id : 0;
      return aId - bId;
    });
    console.log("Questions (sorted by id asc):", questions.map((q: any) => ({ id: q.id, question: q.question, response_type: q.response_type })));

    // Check OneDrive folder for completions (only for questions with text)
    const validQuestions = questions
      .filter((q: any) => typeof q.question === 'string' && q.question)
      .map((q: any) => ({ question: q.question as string }));

    const completionStatus = await checkQuestionCompletion(
      loginKey,
      clientData.client_name || 'unknown_client',
      validQuestions
    );

    // Build responses keyed by the sorted question index to align with client UI
    const responses: Record<string, { completed: boolean }> = {};
    questions.forEach((q: any, index: number) => {
      if (typeof q.question === 'string' && q.question && q.response_type !== 'notice') {
        if (completionStatus[q.question]) {
          responses[String(index)] = { completed: true };
        }
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
