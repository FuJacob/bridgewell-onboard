# Component Architecture Documentation

## Overview

This document outlines the organized component structure for the Bridgewell Onboarding frontend application. The components have been refactored and organized into logical folders for better maintainability, reusability, and developer experience.

## Folder Structure

```
src/
├── components/
│   ├── ui/              # Basic UI components (buttons, inputs, etc.)
│   ├── forms/           # Form-related components
│   ├── layout/          # Layout components (headers, footers, etc.)
│   ├── pages/           # Page-specific components
│   └── shared/          # Shared/common components
├── types/               # Shared TypeScript interfaces
└── app/                 # Next.js app directory
```

## Component Categories

### 🎨 UI Components (`/ui`)

Basic reusable UI elements that form the foundation of the design system.

- **Button.tsx** - Reusable button with variants (primary, secondary, danger, outline) and sizes
- **Input.tsx** - Form input with label, error, and helper text support
- **Textarea.tsx** - Textarea component with consistent styling
- **FileUpload.tsx** - File upload component with drag & drop styling
- **LoadingSpinner.tsx** - Loading indicator with configurable size and message
- **SignOutButton.tsx** - Sign out button for authenticated users

### 📝 Form Components (`/forms`)

Components specifically designed for form handling and user input.

- **LoginForm.tsx** - Admin login form component
- **ClientLoginForm.tsx** - Client portal login form
- **FormModal.tsx** - Modal for creating/editing forms
- **QuestionEditor.tsx** - Component for editing individual questions
- **TemplateSelectionModal.tsx** - Modal for selecting form templates

### 🏗️ Layout Components (`/layout`)

Components that define the overall page structure and navigation.

- **PageHeader.tsx** - Reusable page header with logo, title, and navigation
- **Nav.tsx** - Main navigation component
- **Footer.tsx** - Footer component

### 📄 Page Components (`/pages`)

Components specific to particular pages or page sections.

- **Landing.tsx** - Homepage landing section
- **FormCard.tsx** - Card component for displaying forms in dashboard
- **QuestionCard.tsx** - Card for displaying and handling individual questions
- **CompletionBar.tsx** - Progress bar showing form completion status
- **SubmissionResponseCard.tsx** - Card for displaying form submission responses

### 🔄 Shared Components (`/shared`)

Common components used across multiple pages/features.

- **ErrorMessage.tsx** - Consistent error message display
- **EmptyState.tsx** - Empty state component with actions
- **SuccessModal.tsx** - Success state modal

## Type Organization

### 📋 Shared Types (`/types/index.ts`)

Central location for shared TypeScript interfaces:

- `Question` - Form question structure
- `ClientData` - Client information structure
- `FormData` - Form data structure
- `FormSubmission` - Submission data structure
- `ResponseData` - Response data structure
- `LoadingSpinnerProps` - Loading spinner props
- `LoginFormData` - Login form data structure

**Note:** Component-specific types are kept inline within their respective components when they're only used in that component.

## Import Strategy

Each component folder includes an `index.ts` file for convenient imports:

```typescript
// Instead of multiple imports
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

// You can use barrel exports
import { Button, Input } from "@/components/ui";
```

## Key Refactoring Achievements

### 🎯 Pages Refactored

1. **Login Page** (`/login/page.tsx`)

   - Reduced from 74 lines to 8 lines (89% reduction)
   - Extracted LoginForm component
   - Improved reusability and testability

2. **Client Login Page** (`/client/page.tsx`)

   - Reduced from 207 lines to 70 lines (66% reduction)
   - Extracted ClientLoginForm component
   - Better separation of concerns

3. **Client Form Page** (`/client/form/[key]/page.tsx`)

   - Reduced from 650 lines to 350 lines (46% reduction)
   - Extracted QuestionCard, CompletionBar components
   - Improved maintainability and readability

4. **Submissions Page** (`/submissions/[key]/page.tsx`)

   - Reduced from 311 lines to 120 lines (61% reduction)
   - Extracted SubmissionResponseCard, PageHeader components
   - Better error handling and empty states

5. **Dashboard Page** (previously refactored)
   - Already componentized with FormCard, FormModal, etc.
   - Updated to use new organized import structure

### 🏆 Benefits Achieved

1. **Maintainability**: Components are logically organized and easier to find
2. **Reusability**: UI components can be reused across different pages
3. **Type Safety**: Centralized shared types with component-specific types inline
4. **Developer Experience**: Consistent patterns and clear folder structure
5. **Testing**: Smaller, focused components are easier to test
6. **Performance**: Better tree shaking with organized imports

### 📊 Code Reduction Summary

| Page         | Original Lines | Refactored Lines | Reduction |
| ------------ | -------------- | ---------------- | --------- |
| Login        | 74             | 8                | 89%       |
| Client Login | 207            | 70               | 66%       |
| Client Form  | 650            | 350              | 46%       |
| Submissions  | 311            | 120              | 61%       |

**Total**: Reduced ~1,242 lines to ~548 lines (56% overall reduction)

### 🔧 Technical Improvements

1. **Consistent Error Handling**: ErrorMessage component used across all pages
2. **Loading States**: LoadingSpinner component with configurable messages
3. **Form Validation**: Centralized in reusable form components
4. **Empty States**: EmptyState component for consistent no-data experiences
5. **Responsive Design**: All components follow mobile-first responsive patterns
6. **Accessibility**: Proper ARIA labels and keyboard navigation support

## Usage Examples

### Using UI Components

```typescript
import { Button, Input, LoadingSpinner } from '@/components/ui';

<Input
  label="Email"
  type="email"
  error={errors.email}
  required
/>
<Button variant="primary" loading={isLoading}>
  Submit
</Button>
```

### Using Page Components

```typescript
import { QuestionCard, CompletionBar } from '@/components/pages';

<CompletionBar completedCount={5} totalCount={10} />
<QuestionCard
  question={question}
  onSubmit={handleSubmit}
  isSubmitted={false}
/>
```

### Using Shared Components

```typescript
import { ErrorMessage, EmptyState } from "@/components/shared";

{
  error && <ErrorMessage message={error} />;
}
{
  !data && <EmptyState title="No data" description="..." />;
}
```

## Best Practices

1. **Component Naming**: Use PascalCase and descriptive names
2. **Props Interface**: Define interfaces for all component props
3. **Default Props**: Use default parameters for optional props
4. **Error Boundaries**: Wrap components that might fail
5. **Loading States**: Always provide loading feedback
6. **Responsive Design**: Mobile-first approach with Tailwind CSS
7. **Type Safety**: Use TypeScript for all components
8. **Performance**: Use React.memo for expensive components when needed

## Future Enhancements

1. **Storybook Integration**: Document components with interactive examples
2. **Unit Testing**: Add Jest/React Testing Library tests for each component
3. **Theme System**: Implement design tokens for consistent theming
4. **Animation Library**: Add Framer Motion for smooth transitions
5. **Accessibility Testing**: Automated a11y testing with axe-core
6. **Component Library**: Extract components into a separate npm package

This architecture provides a solid foundation for scaling the application while maintaining code quality and developer productivity.
