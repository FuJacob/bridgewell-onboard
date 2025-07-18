// Shared types used across multiple components/pages
import { Tables, TablesInsert, TablesUpdate } from "../../database.types";

// Database types - direct exports from source of truth
export type Client = Tables<"clients">;
export type ClientInsert = TablesInsert<"clients">;
export type ClientUpdate = TablesUpdate<"clients">;

export type Question = Tables<"questions">;
export type QuestionInsert = TablesInsert<"questions">;
export type QuestionUpdate = TablesUpdate<"questions">;

export type Template = Tables<"templates">;
export type TemplateInsert = TablesInsert<"templates">;
export type TemplateUpdate = TablesUpdate<"templates">;

// Application-specific types
export interface QuestionTemplate {
  fileName: string;
  fileId: string;
  uploadedAt?: string;
  fileObject?: File;
}

// Extended question type for application use (with structured templates)
export interface AppQuestion extends Omit<Question, "templates"> {
  templates?: QuestionTemplate[] | null;
}

// Extended template type for application use
export interface AppTemplate extends Omit<Template, "questions"> {
  questions: AppQuestion[];
}

// Form-specific types that match application usage
export interface FormQuestion {
  question: string;
  description: string;
  response_type: string;
  due_date: string;
  templates?: QuestionTemplate[] | null;
  link?: string;
  // Optional database fields for compatibility
  id?: number;
  created_at?: string;
  login_key?: string;
}

// Helper function to convert FormQuestion to Question for database operations
export const convertFormQuestionToQuestion = (
  formQ: FormQuestion,
  loginKey: string
): QuestionInsert => ({
  created_at: formQ.created_at || new Date().toISOString(),
  description: formQ.description,
  due_date: formQ.due_date,
  ...(formQ.id !== undefined ? { id: formQ.id } : {}),
  link: formQ.link || null,
  login_key: loginKey,
  question: formQ.question,
  response_type: formQ.response_type,
  templates: formQ.templates ? JSON.stringify(formQ.templates) : null,
});

// Extended types for application use
export interface ClientData
  extends Omit<Client, "login_key" | "client_name" | "last_active_at"> {
  id: string;
  clientName: string;
  organization: string;
  email: string;
  description: string;
  questions: Question[];
  loginKey: string;
  last_active_at: string;
}

// For backward compatibility, keep ClientFormData as alias
export type ClientFormData = Client;

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
