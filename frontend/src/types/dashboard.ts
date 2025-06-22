export interface FormData {
  id: string;
  created_at: string;
  client_name: string;
  organization: string;
  login_key: string;
  questions: string;
}

export interface Template {
  id: string;
  created_at: string;
  name: string;
  questions: string;
}

export interface Question {
  question: string;
  description: string;
  responseType: string;
  dueDate: string;
  template?: {
    fileName: string;
    fileId: string;
    uploadedAt: string;
    fileObject?: File;
  } | null;
}
