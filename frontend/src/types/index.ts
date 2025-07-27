// Shared types used across multiple components/pages
import { Database, Tables, TablesInsert, TablesUpdate } from "../../database.types";

// Re-export database types for convenience
export type { Database, Tables, TablesInsert, TablesUpdate };

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
export interface ClientData extends Client {
  questions: Question[];
}

// Submission status tracking (based on OneDrive file existence)
export interface SubmissionData {
  login_key: string;
  client_name: string | null;
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

// Error handling types
export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export interface SharePointError {
  message: string;
  statusCode?: number;
  errorCode?: string;
  details?: unknown;
}

export interface APIResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

// Validation helpers
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Type guards for runtime validation
export const isClient = (obj: unknown): obj is Client => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'login_key' in obj &&
    'created_at' in obj &&
    typeof (obj as any).login_key === 'string' &&
    typeof (obj as any).created_at === 'string'
  );
};

export const isQuestion = (obj: unknown): obj is Question => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'created_at' in obj &&
    typeof (obj as any).id === 'number' &&
    typeof (obj as any).created_at === 'string'
  );
};

export const isTemplate = (obj: unknown): obj is Template => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'created_at' in obj &&
    typeof (obj as any).id === 'number' &&
    typeof (obj as any).created_at === 'string'
  );
};

// Input validation functions
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }
  return { isValid: errors.length === 0, errors };
};

export const validateLoginKey = (loginKey: string): ValidationResult => {
  const errors: string[] = [];
  if (!loginKey || typeof loginKey !== 'string') {
    errors.push('Login key is required');
  } else if (loginKey.length < 10) {
    errors.push('Login key must be at least 10 characters');
  }
  return { isValid: errors.length === 0, errors };
};

export const validateClientName = (name: string): ValidationResult => {
  const errors: string[] = [];
  if (!name || typeof name !== 'string') {
    errors.push('Client name is required');
  } else if (name.trim().length < 2) {
    errors.push('Client name must be at least 2 characters');
  } else if (name.length > 100) {
    errors.push('Client name must be less than 100 characters');
  }
  return { isValid: errors.length === 0, errors };
};

export const validateQuestionText = (question: string): ValidationResult => {
  const errors: string[] = [];
  if (!question || typeof question !== 'string') {
    errors.push('Question text is required');
  } else if (question.trim().length < 3) {
    errors.push('Question text must be at least 3 characters');
  } else if (question.length > 500) {
    errors.push('Question text must be less than 500 characters');
  }
  return { isValid: errors.length === 0, errors };
};
