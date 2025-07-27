
# Bridgewell Onboarding Platform - Codebase Documentation

## 1. Project Overview

This document provides a comprehensive overview of the Bridgewell Onboarding Platform's codebase. The platform is a web application designed to streamline the client onboarding process for Bridgewell Financial. It allows administrators to create and manage custom onboarding forms, which are then filled out by clients. The application handles form creation, client management, file uploads, and submission tracking.

### Key Features:

- **Admin Dashboard**: A central hub for administrators to create, view, and manage client onboarding forms.
- **Form Generation**: Dynamically create forms with various question types, including text and file uploads.
- **Template Management**: Save, edit, and reuse form templates to expedite form creation.
- **Secure Client Access**: Clients access their personalized forms via a unique, secure login key.
- **File Uploads**: Seamlessly upload and manage files, which are securely stored in Microsoft OneDrive.
- **Real-time Progress Tracking**: Both admins and clients can monitor the progress of form completion.
- **Database Integration**: All data is stored in a Supabase (PostgreSQL) database.

---

## 2. Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (v15) with the App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [Supabase](https://supabase.io/) (PostgreSQL)
- **Authentication**: [Supabase Auth](https://supabase.com/docs/guides/auth)
- **File Storage**: [Microsoft Graph API](https://developer.microsoft.com/en-us/graph) (for OneDrive/SharePoint integration)
- **Deployment**: Vercel

---

## 3. Project Structure

The `frontend` directory contains the entire Next.js application. Here's a breakdown of the key directories:

```
frontend/
├── public/                 # Static assets (images, videos, etc.)
├── src/
│   ├── app/                # Core application logic (App Router)
│   │   ├── api/            # API routes (backend logic)
│   │   ├── client/         # Client-facing pages (form filling)
│   │   ├── dashboard/      # Admin dashboard page
│   │   ├── login/          # Admin login page
│   │   ├── submissions/    # Page to view form submissions
│   │   └── utils/          # Utility functions (Supabase, Microsoft Graph)
│   ├── components/         # Reusable React components
│   │   ├── forms/          # Form-related components
│   │   ├── layout/         # Layout components (Nav, Footer)
│   │   ├── pages/          # Components specific to certain pages
│   │   ├── shared/         # Components shared across multiple pages
│   │   └── ui/             # Basic UI elements (Button, Input)
│   ├── services/           # API service wrappers (client-side)
│   └── types/              # TypeScript type definitions
├── middleware.ts           # Next.js middleware for session management
└── ...                     # Configuration files (next.config.ts, tailwind.config.ts, etc.)
```

---

## 4. File-by-File Documentation

### 4.1. Root Files

#### `README.md`
- **Purpose**: Provides a general overview of the project, including features, tech stack, and setup instructions.
- **Key Information**:
  - Project title and description.
  - Instructions for cloning, installing dependencies, and setting up environment variables.
  - Commands to run the development server.

#### `frontend/COMPONENT_ARCHITECTURE.md`
- **Purpose**: Documents the component structure and organization of the frontend application.
- **Key Information**:
  - Outlines the folder structure for components (`ui`, `forms`, `layout`, `pages`, `shared`).
  - Describes the purpose of each component category.
  - Details the refactoring achievements, including code reduction metrics.
  - Provides best practices for component development.

#### `frontend/database.types.ts`
- **Purpose**: Contains TypeScript types automatically generated from the Supabase database schema. This ensures type safety when interacting with the database.
- **Key Information**:
  - Defines types for each table (`clients`, `questions`, `templates`).
  - Exports `Row`, `Insert`, and `Update` types for each table.

#### `frontend/middleware.ts`
- **Purpose**: Implements Next.js middleware to manage user sessions.
- **Functionality**:
  - Intercepts incoming requests.
  - Uses the `updateSession` utility from `@/app/utils/supabase/middleware` to refresh the user's session.
  - Protects routes by redirecting unauthenticated users to the login page.
- **Configuration**: The `matcher` config specifies which paths the middleware should run on, excluding static files and images.

#### `frontend/next.config.ts`
- **Purpose**: Configuration file for the Next.js application.
- **Key Settings**:
  - `eslint.ignoreDuringBuilds`: Disables ESLint checks during the build process.
  - `serverExternalPackages`: Lists packages that should not be bundled on the server.
  - `headers`: Sets custom headers for API routes, such as `Access-Control-Max-Age`.

#### `frontend/tailwind.config.ts` & `frontend/postcss.config.mjs`
- **Purpose**: Configuration files for Tailwind CSS.
- **Key Settings**:
  - `content`: Specifies the files to scan for Tailwind classes.
  - `theme`: Defines the custom color palette (`primary`, `secondary`, `accent`) and fonts.
  - `plugins`: Configures PostCSS plugins.

### 4.2. `src/app` - Core Application

#### `src/app/layout.tsx`
- **Purpose**: The root layout for the entire application. It wraps all pages.
- **Functionality**:
  - Defines the `<html>` and `<body>` tags.
  - Imports and applies the `Lexend` font.
  - Sets the site metadata (title, description, favicon).

#### `src/app/globals.css`
- **Purpose**: Global stylesheet for the application.
- **Key Styles**:
  - Imports Tailwind CSS base, components, and utilities.
  - Defines root CSS variables for background and foreground colors.
  - Sets the default font family.

#### `src/app/page.tsx`
- **Purpose**: The main landing page of the application.
- **Components Used**:
  - `Nav`: The main navigation bar.
  - `Landing`: The main content of the landing page.
  - `Footer`: The application footer.

#### `src/app/login/page.tsx` & `src/app/login/actions.ts`
- **`page.tsx`**: The admin login page. It renders the `LoginForm` component.
- **`actions.ts`**: Contains server-side actions for authentication.
  - `login()`: Handles user login by calling `supabase.auth.signInWithPassword`.
  - `signOut()`: Signs the user out.
  - `signup()`: Handles user registration (if enabled).
  - `getAllForms()`: Fetches all client forms from the database.

#### `src/app/dashboard/page.tsx`
- **Purpose**: The admin dashboard, where administrators can view and manage client forms.
- **Functionality**:
  - Fetches and displays a list of all client forms.
  - Allows searching for forms by organization.
  - Provides functionality to create new forms, either from a blank slate or from a template.
  - Allows deleting client forms.
  - Manages state for various modals (create form, edit template, delete confirmation).
- **Components Used**: `FormCard`, `LoadingSpinner`, `SuccessModal`, `TemplateSelectionModal`, `EditTemplateModal`, `FormModal`, etc.

#### `src/app/client/form/[key]/page.tsx`
- **Purpose**: The page where clients fill out their onboarding form. The `[key]` is the unique login key for the client.
- **Functionality**:
  - Fetches the form data (client info, questions, submissions) based on the login key.
  - Displays the questions in a user-friendly format using `QuestionCard` components.
  - Tracks and displays the form completion progress with `CompletionBar`.
  - Handles the submission of individual questions (both text and file uploads).
  - Allows the client to submit the entire form once all questions are completed.
  - Periodically updates the `last_active_at` timestamp for the client.

#### `src/app/submissions/[key]/page.tsx`
- **Purpose**: A page for viewing the submitted responses for a specific form.
- **Functionality**:
  - Fetches the client's submissions based on the login key.
  - Displays each question and its corresponding response using `SubmissionResponseCard`.
  - Provides a download link for any files that were submitted.

### 4.3. `src/app/api` - API Routes

This directory contains all the backend logic for the application, implemented as Next.js API routes.

#### Admin Routes (`src/app/api/admin/...`)
- **`create-form/route.ts`**: Handles the creation of a new client form. It receives form data, creates a new client record in Supabase, creates corresponding folders in OneDrive, and uploads any template files.
- **`delete-client/route.ts`**: Deletes a client and all their associated data from both Supabase and OneDrive.
- **`delete-template/route.ts`**: Deletes a form template from the database.
- **`get-templates/route.ts`**: Fetches all saved form templates from the database.
- **`redo-question/route.ts`**: Resets a specific question for a client by deleting their previous submission for that question from OneDrive.
- **`save-template/route.ts`**: Saves a new form template to the database, including any associated template files.
- **`update-form/route.ts`**: Updates an existing client form with new or modified questions.
- **`update-template/route.ts`**: Updates an existing form template.
- **`upload-template/route.ts`**: Uploads a template file to a temporary location in OneDrive.

#### Client Routes (`src/app/api/client/...`)
- **`download-template/route.ts`**: Downloads a single template file from OneDrive.
- **`download-templates/route.ts`**: Downloads multiple template files as a single zip archive.
- **`form-data/route.ts`**: Fetches all the data required to display a client form (client info, questions).
- **`submissions/route.ts`**: Fetches the submission status for a client's form.
- **`submit-form/route.ts`**: Marks a client's form as submitted.
- **`submit-question/route.ts`**: Handles the submission of a single question, uploading the response (text or file) to OneDrive.
- **`update-last-active-at/route.ts`**: Updates the `last_active_at` timestamp for a client.
- **`validate-key/route.ts`**: Validates a client's login key.

### 4.4. `src/app/utils` - Utility Functions

#### Microsoft Graph Utilities (`src/app/utils/microsoft/...`)
- **`auth.ts`**: Contains the `getAccessToken` function, which authenticates with Microsoft Entra ID (formerly Azure AD) to obtain an access token for the Microsoft Graph API.
- **`graph.ts`**: A collection of functions for interacting with the Microsoft Graph API (specifically for OneDrive).
  - `createClientFolder()`: Creates a new folder for a client in OneDrive.
  - `createQuestionFolders()`: Creates subfolders for each question within a client's folder.
  - `uploadFileToClientFolder()`: Uploads a file to a specific location in a client's folder.
  - `deleteFileFromOneDrive()`: Deletes a file or folder from OneDrive.
  - `checkQuestionCompletion()`: Checks if a question has been completed by looking for files in the corresponding "answer" subfolder.

#### Supabase Utilities (`src/app/utils/supabase/...`)
- **`client.ts`**: Creates a Supabase client for use on the client-side (in the browser).
- **`server.ts`**: Creates a Supabase client for use on the server-side (in API routes and Server Components). It also includes `createServiceClient` for creating a client with admin privileges.
- **`middleware.ts`**: Provides the `updateSession` function used by the main `middleware.ts` file to manage user sessions.

### 4.5. `src/components` - React Components

This directory is organized into subdirectories based on component function.

#### `src/components/ui`
Contains basic, reusable UI elements.
- **`Button.tsx`**: A versatile button component with different variants, sizes, and a loading state.
- **`Input.tsx`**: A styled text input component with label and error handling.
- **`Textarea.tsx`**: A styled textarea component.
- **`FileUpload.tsx`**: A component for file uploads with a drag-and-drop interface.
- **`LoadingSpinner.tsx`**: A loading spinner with a customizable message.
- **`SignOutButton.tsx`**: A simple button for signing the user out.

#### `src/components/forms`
Contains components specifically for building forms.
- **`LoginForm.tsx`**: The login form for administrators.
- **`ClientLoginForm.tsx`**: The login form for clients, using a login key.
- **`FormModal.tsx`**: A modal for creating and editing client forms.
- **`QuestionEditor.tsx`**: A component for adding, editing, and reordering questions within a form.
- **`TemplateSelectionModal.tsx`**: A modal that allows admins to choose between starting with a blank form or using a saved template.
- **`EditTemplateModal.tsx`**: A modal for editing existing form templates.

#### `src/components/layout`
Contains components that define the page structure.
- **`Nav.tsx`**: The main navigation bar, which displays different content for authenticated and unauthenticated users.
- **`Footer.tsx`**: The application footer.
- **`PageHeader.tsx`**: A reusable header for pages, with a title, subtitle, and optional actions.

#### `src/components/pages`
Contains components that are specific to a particular page or a major section of a page.
- **`Landing.tsx`**: The main content of the landing page, including the client login form and process steps.
- **`FormCard.tsx`**: A card component used on the admin dashboard to display a summary of a client form.
- **`QuestionCard.tsx`**: A card component used on the client form page to display a single question and its input fields.
- **`CompletionBar.tsx`**: A progress bar that shows the completion status of a form.
- **`SubmissionResponseCard.tsx`**: A card for displaying a single question and its submitted response on the submissions page.

#### `src/components/shared`
Contains common components used across multiple pages.
- **`SuccessModal.tsx`**: A modal that displays a success message, typically after a form is created or submitted.
- **`DeleteConfirmationModal.tsx`**: A modal that asks the user to confirm a delete action.
- **`ErrorMessage.tsx`**: A component for displaying error messages in a consistent style.
- **`EmptyState.tsx`**: A component to display when there is no data to show (e.g., no forms on the dashboard).
- **`LoadingOverlay.tsx`**: An overlay that can be shown during long-running operations like file uploads or deletions.
- **`SaveTemplateModal.tsx`**: A modal for saving a form as a template.

### 4.6. `src/services` - API Service Wrappers

This directory contains client-side functions that wrap the API routes, making them easier to use from the frontend components.

- **`admin.ts`**: Contains functions for admin-related actions, such as `deleteClient`, `createForm`, `updateForm`, and `redoQuestion`.
- **`client.ts`**: Contains functions for client-related actions, such as `validateClientKey`, `getFormData`, `submitQuestion`, and `submitForm`.
- **`templates.ts`**: Contains functions for managing templates, such as `saveTemplate`, `getTemplates`, `deleteTemplate`, and `updateTemplate`.

### 4.7. `src/types` - TypeScript Definitions

#### `src/types/index.ts`
- **Purpose**: Centralizes all shared TypeScript types and interfaces for the application.
- **Key Types**:
  - **Database Types**: Re-exports the auto-generated types from `database.types.ts` (`Client`, `Question`, `Template`).
  - **Application-Specific Types**: Defines more specific types for use in the application, such as `AppQuestion` (which has a structured `templates` array instead of JSON) and `FormQuestion` (for the form editor).
  - **Helper Functions**: Includes `convertFormQuestionToQuestion` to transform a `FormQuestion` into a `QuestionInsert` object suitable for the database.
  - **API Data Types**: Defines interfaces for the data returned by the API services (`ClientData`, `SubmissionData`, etc.).

---
This documentation provides a thorough guide to the codebase. For more specific details, please refer to the source code and the inline comments.
