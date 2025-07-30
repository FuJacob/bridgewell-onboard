// Environment validation - defer to runtime
function validateEnvironment(): void {
  if (!process.env.TENANT_ID) {
    throw new Error('TENANT_ID environment variable is required');
  }
  if (!process.env.AZURE_CLIENT_ID) {
    throw new Error('AZURE_CLIENT_ID environment variable is required');
  }
  if (!process.env.AZURE_CLIENT_SECRET) {
    throw new Error('AZURE_CLIENT_SECRET environment variable is required');
  }
}

function getTokenEndpoint(): string {
  validateEnvironment();
  return `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;
}
const REQUEST_TIMEOUT = 30000; // 30 seconds

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

// Token cache - store in memory for production, consider Redis for scale
let tokenCache: CachedToken | null = null;

// Add buffer time (5 minutes) before token expires
const TOKEN_BUFFER_MS = 5 * 60 * 1000;

function isTokenValid(cachedToken: CachedToken): boolean {
  return Date.now() < (cachedToken.expiresAt - TOKEN_BUFFER_MS);
}

export async function getAccessToken(): Promise<string> {
  if (process.env.NODE_ENV === 'development') {
    console.log("Starting authentication process...");
  }

  // Return cached token if still valid
  if (tokenCache && isTokenValid(tokenCache)) {
    if (process.env.NODE_ENV === 'development') {
      console.log("Using cached Microsoft Graph token");
    }
    return tokenCache.token;
  }

  // Clear invalid cache
  tokenCache = null;

  try {
    console.log("Making token request to Microsoft...");
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    const response = await fetch(getTokenEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.AZURE_CLIENT_ID!,
        client_secret: process.env.AZURE_CLIENT_SECRET!,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
      signal: controller.signal,
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);

    console.log("Token response status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("Error response from Microsoft:", error);
      throw new Error(
        `Failed to get access token: ${
          error.error_description || error.message || "Unknown error"
        }`
      );
    }

    const data: TokenResponse = await response.json();
    
    // Cache the token with expiration time
    const expiresAt = Date.now() + (data.expires_in * 1000);
    tokenCache = {
      token: data.access_token,
      expiresAt
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log("Successfully received and cached Microsoft Graph token");
      console.log(`Token expires at: ${new Date(expiresAt).toISOString()}`);
    }

    return data.access_token;
  } catch (error) {
    // Clear cache on error
    tokenCache = null;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Authentication request timed out. Please try again.');
      }
      if (error.message.includes('fetch')) {
        throw new Error('Network error during authentication. Please check your internet connection.');
      }
    }
    
    console.error("Error in getAccessToken:", error);
    throw error;
  }
}

// Function to clear token cache (useful for testing or forced refresh)
export function clearTokenCache(): void {
  tokenCache = null;
  if (process.env.NODE_ENV === 'development') {
    console.log("Token cache cleared");
  }
}

// Function to check if we have a valid cached token
export function hasValidCachedToken(): boolean {
  return tokenCache !== null && isTokenValid(tokenCache);
}
