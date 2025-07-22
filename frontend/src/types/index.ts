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

// Form-specific types that match database schema
export interface FormQuestion {
  question: string | null;
  description: string | null;
  response_type: string | null;
  due_date: string | null;
  templates?: QuestionTemplate[] | null;
  link?: string | null;
  // Optional database fields for compatibility
  id?: number;
  created_at?: string;
  login_key?: string | null;
}

// Helper function to convert FormQuestion to Question for database operations
export const convertFormQuestionToQuestion = (
  formQ: FormQuestion,
  loginKey: string
): QuestionInsert => ({
  created_at: formQ.created_at || new Date().toISOString(),
  description: formQ.description,
  due_date: formQ.due_date,
  link: formQ.link || null,
  login_key: loginKey,
  question: formQ.question,
  response_type: formQ.response_type,
  templates: formQ.templates ? JSON.stringify(formQ.templates) : null,
});

// Extended types for application use - aligned with database schema
export interface ClientData {
  login_key: string;
  client_name: string | null;
  organization: string | null;
  email: string | null;
  description: string | null;
  questions: Question[];
  created_at: string;
  last_active_at: string | null;
}


// Note: submissions table not found in current database schema
// Using Record<string, unknown> as fallback for submission data
export type SubmissionRecord = Record<string, unknown>;

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

// Template-specific types for API routes
export interface TemplateQuestion {
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

export interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export interface LoginFormData {
  email: string;
  password: string;
}
