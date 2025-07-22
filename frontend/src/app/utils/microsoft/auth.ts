const TOKEN_ENDPOINT = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function getAccessToken(): Promise<string> {
  if (process.env.NODE_ENV === 'development') {
    console.log("Starting authentication process...");
  }

  if (!process.env.AZURE_CLIENT_ID || !process.env.AZURE_CLIENT_SECRET) {
    console.error("Missing required Azure AD environment variables");
    throw new Error("Missing Azure AD credentials in environment variables");
  }

  try {
    console.log("Making token request to Microsoft...");
    const response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.AZURE_CLIENT_ID,
        client_secret: process.env.AZURE_CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    });

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
    if (process.env.NODE_ENV === 'development') {
      console.log("Successfully received Microsoft Graph token");
    }

    return data.access_token;
  } catch (error) {
    console.error("Error in getAccessToken:", error);
    throw error;
  }
}
