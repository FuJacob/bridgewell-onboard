const TENANT_ID = "9615d525-efda-4fa9-9015-54aa168ceeb8";
const TOKEN_ENDPOINT = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export async function getAccessToken(): Promise<string> {
    console.log("Starting authentication process...");
    console.log("Using Tenant ID:", TENANT_ID);
    console.log("Using Client ID:", process.env.AZURE_CLIENT_ID);
    
    if (!process.env.AZURE_CLIENT_ID || !process.env.AZURE_CLIENT_SECRET) {
        console.error("Missing environment variables:");
        console.error("AZURE_CLIENT_ID:", !!process.env.AZURE_CLIENT_ID);
        console.error("AZURE_CLIENT_SECRET:", !!process.env.AZURE_CLIENT_SECRET);
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
            console.error('Error response from Microsoft:', error);
            throw new Error(`Failed to get access token: ${error.error_description || error.message || 'Unknown error'}`);
        }

        const data: TokenResponse = await response.json();
        console.log("Successfully received token:");
        console.log("- Token type:", data.token_type);
        console.log("- Expires in:", data.expires_in, "seconds");
        console.log("- Token length:", data.access_token.length);
        
        return data.access_token;
    } catch (error) {
        console.error('Error in getAccessToken:', error);
        throw error;
    }
} 