# Services

This folder contains all API service functions that make HTTP requests to our backend endpoints. The services are organized by domain:

## Structure

- `client.ts` - Client-related API calls (form data, submissions, validation)
- `admin.ts` - Admin dashboard operations (form creation, client management)
- `templates.ts` - Template management (save, load, delete templates)
- `index.ts` - Central export file for all services

## Usage

Import services from the main services module:

```typescript
import {
  validateClientKey,
  getClientFormData,
  submitQuestionResponse,
} from "@/services/client";

import { deleteClient, createForm } from "@/services/admin";

import {
  saveTemplate,
  getTemplates,
  deleteTemplate,
} from "@/services/templates";

// Or import everything
import * as clientServices from "@/services/client";
import * as adminServices from "@/services/admin";
import * as templateServices from "@/services/templates";
```

## Benefits

1. **Centralized API calls** - All HTTP requests are in one place
2. **Reusability** - Services can be used across multiple components
3. **Type safety** - All services include proper TypeScript interfaces
4. **Error handling** - Consistent error handling across all API calls
5. **Maintainability** - Easy to update API endpoints or add new functionality

## Error Handling

All service functions throw errors that should be caught by the calling component:

```typescript
try {
  await validateClientKey(key);
  // Success logic
} catch (error) {
  // Handle error
  console.error("Validation failed:", error.message);
}
```
