// Shared types used across multiple components/pages

export interface Question {
  question: string;
  description: string;
  response_type: string;
  due_date: string;
  templates?:
    | {
        fileName: string;
        fileId: string;
        uploadedAt?: string;
      }[]
    | null;
}

export interface ClientData {
  id: string;
  clientName: string;
  organization: string;
  questions: Question[];
}

export interface FormData {
  id: string;
  client_name: string;
  organization: string;
  questions: string;
  login_key: string;
}

export interface FormSubmission {
  id: string;
  client_id: string;
  client_name: string;
  login_key: string;
  responses: string;
  submitted_at: string;
}

export interface ResponseData {
  questionText: string;
  response_type: string;
  fileUrl?: string;
  fileName?: string;
  textResponse?: string;
}

export interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export interface LoginFormData {
  email: string;
  password: string;
}
