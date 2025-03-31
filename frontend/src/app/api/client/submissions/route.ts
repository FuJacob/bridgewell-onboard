import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { checkQuestionCompletion } from "@/app/utils/microsoft/graph";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const loginKey = searchParams.get("key");

    if (!loginKey) {
        return NextResponse.json({ error: "Login key is required" }, { status: 400 });
    }

    try {
        console.log("Checking submission status for key:", loginKey);
        const supabase = await createClient();

        // Get client data to verify login key and get questions
        const { data: clientData, error: clientError } = await supabase
            .from("clients")
            .select("id, client_name, questions")
            .eq("login_key", loginKey)
            .single();

        if (clientError || !clientData) {
            console.error("Error fetching client data:", clientError);
            return NextResponse.json({ error: "Invalid login key" }, { status: 400 });
        }

        const questions = typeof clientData.questions === 'string'
            ? JSON.parse(clientData.questions)
            : clientData.questions;

        // Check OneDrive folder for completions
        const completionStatus = await checkQuestionCompletion(
            loginKey,
            clientData.client_name,
            questions
        );

        // Convert the completion status object to a responses-like format
        // where the key is the question index and the value indicates it's completed
        const responses: Record<string, any> = {};
        questions.forEach((question: any, index: number) => {
            if (completionStatus[question.question]) {
                responses[index] = { completed: true };
            }
        });

        return NextResponse.json({
            client_id: clientData.id,
            client_name: clientData.client_name,
            login_key: loginKey,
            responses
        });
    } catch (error) {
        console.error("Error checking submissions:", error);
        return NextResponse.json(
            { error: "Failed to check submission status" },
            { status: 500 }
        );
    }
} 