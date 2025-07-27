import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createClientBase } from '@supabase/supabase-js';
import type { Database, DatabaseError } from "@/types";

export async function createClient() {
  const cookieStore = await cookies();

  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing required Supabase environment variables");
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Create a service role client for admin operations
export function createServiceClient() {
  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing required Supabase service role environment variables");
  }

  try {
    const supabaseAdmin = createClientBase<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    return supabaseAdmin;
  } catch (error) {
    console.error("Error creating Supabase service client:", error);
    throw new Error("Failed to initialize admin database client");
  }
}

// Enhanced error handling for database operations
export function handleDatabaseError(error: any): DatabaseError {
  if (!error) {
    return { message: "Unknown database error occurred" };
  }

  // Supabase error structure
  if (error.code || error.message) {
    return {
      message: error.message || "Database operation failed",
      code: error.code,
      details: error.details,
      hint: error.hint,
    };
  }

  // Generic error fallback
  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "Unexpected database error" };
}

// Wrapper for safe database operations with retry logic
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError!;
}
