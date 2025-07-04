// Shared types used across multiple components/pages

export interface QuestionTemplate {
  fileName: string;
  fileId: string;
  uploadedAt?: string;
  fileObject?: File;
}

export interface Question {
  id?: number;
  question: string;
  description: string;
  response_type: string;
  due_date: string;
  templates?: QuestionTemplate[] | null;
  link?: string;
}

export interface ClientData {
  id: string;
  clientName: string;
  organization: string;
  questions: Question[];
  loginKey: string;
  last_active_at: string;
}

export interface ClientFormData {
  id: string;
  client_name: string;
  email: string;
  organization: string;
  description: string;
  questions: string;
  login_key: string;
  created_at: string;
}

export interface Template {
  id: string;
  created_at: string;
  name: string;
  questions: string;
}

export interface FormSubmission {
  id: string;
  client_id: string;
  client_name: string;
  login_key: string;
  responses: string;
  submitted_at: string;
}

export interface SubmissionData {
  client_id: string;
  client_name: string;
  login_key: string;
  responses: Record<string, { completed: boolean }>;
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
