import { getAccessToken } from "@/app/utils/microsoft/auth";

const SHAREPOINT_SITE_ID = "bridgewellfinancial.sharepoint.com,80def30d-85bd-4e18-969a-6346931d152d,deb319e5-cef4-4818-9ec3-805bedea8819";
const BASE_URL = "https://graph.microsoft.com/v1.0";
const SITE_URL = `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_SITE_ID}`;

export async function createClientFolder(clientId: string, clientName: string): Promise<string> {
    try {
        console.log("Getting access token for OneDrive...");
        const accessToken = await getAccessToken();
        console.log("Access token received successfully");

        const sanitizedName = clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        const folderName = `${sanitizedName}_${clientId}`;
        console.log("Creating folder with name:", folderName);

        // First, try to create the CLIENTS folder if it doesn't exist
        console.log("Checking if CLIENTS folder exists...");
        console.log("Making request to:", `${SITE_URL}/drive/root:/CLIENTS:/`);
        try {
            const clientsFolderResponse = await fetch(`${SITE_URL}/drive/root:/CLIENTS:/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            });

            console.log("CLIENTS folder check response status:", clientsFolderResponse.status);
            
            if (!clientsFolderResponse.ok) {
                const error = await clientsFolderResponse.json();
                console.log("CLIENTS folder not found, creating it...");
                console.log("Error details:", error);
                
                console.log("Making request to create CLIENTS folder...");
                const createClientsFolderResponse = await fetch(`${SITE_URL}/drive/root:/CLIENTS:/`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: "CLIENTS",
                        folder: {},
                        "@microsoft.graph.conflictBehavior": "rename"
                    })
                });

                console.log("Create CLIENTS folder response status:", createClientsFolderResponse.status);
                
                if (!createClientsFolderResponse.ok) {
                    const error = await createClientsFolderResponse.json();
                    console.error('Error creating CLIENTS folder:', error);
                    throw new Error(`Failed to create CLIENTS folder: ${error.message || 'Unknown error'}`);
                }
                console.log("CLIENTS folder created successfully");
            } else {
                console.log("CLIENTS folder already exists");
            }
        } catch (error) {
            console.error('Error checking/creating CLIENTS folder:', error);
            throw error;
        }

        // Now create the client folder inside CLIENTS
        console.log("Creating client folder inside CLIENTS...");
        console.log("Making request to:", `${SITE_URL}/drive/root:/CLIENTS/${folderName}:/`);
        const response = await fetch(`${SITE_URL}/drive/root:/CLIENTS/${folderName}:/`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: folderName,
                folder: {},
                "@microsoft.graph.conflictBehavior": "rename"
            })
        });

        console.log("Create client folder response status:", response.status);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('OneDrive API error creating client folder:', error);
            throw new Error(`Failed to create client folder: ${error.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log("Client folder created successfully with ID:", data.id);
        return data.id;
    } catch (error) {
        console.error('Error in createClientFolder:', error);
        throw error;
    }
}

export async function createQuestionFolders(
    clientId: string,
    clientName: string,
    questions: Array<{ question: string }>
): Promise<void> {
    try {
        console.log("Getting access token for question folders...");
        const accessToken = await getAccessToken();
        console.log("Access token received successfully");

        const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        const clientFolderName = `${sanitizedClientName}_${clientId}`;
        console.log("Creating question folders in client folder:", clientFolderName);

        for (const question of questions) {
            const sanitizedQuestion = question.question.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
            const folderName = `${sanitizedQuestion}`;
            console.log("Creating folder for question:", folderName);

            console.log("Making request to:", `${SITE_URL}/drive/root:/CLIENTS/${clientFolderName}/${folderName}:/`);
            const response = await fetch(
                `${SITE_URL}/drive/root:/CLIENTS/${clientFolderName}/${folderName}:/`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: folderName,
                        folder: {},
                        "@microsoft.graph.conflictBehavior": "rename"
                    })
                }
            );

            if (!response.ok) {
                const error = await response.json();
                console.error('OneDrive API error creating question folder:', error);
                throw new Error(`Failed to create question folder: ${error.message || 'Unknown error'}`);
            }
            console.log("Question folder created successfully:", folderName);
        }
    } catch (error) {
        console.error('Error in createQuestionFolders:', error);
        throw error;
    }
}

export async function uploadFileToClientFolder(
    clientId: string,
    clientName: string,
    filePath: string,
    fileContent: Blob
): Promise<string> {
    try {
        const accessToken = await getAccessToken();
        const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        const clientFolderName = `${sanitizedClientName}_${clientId}`;

        const response = await fetch(
            `${SITE_URL}/drive/root:/${clientFolderName}/${filePath}:/content`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': fileContent.type,
                },
                body: fileContent
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('Error uploading file:', error);
            throw new Error('Failed to upload file');
        }

        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error('Error in uploadFileToClientFolder:', error);
        throw error;
    }
}

export async function checkQuestionCompletion(
    clientId: string,
    clientName: string,
    questions: Array<{ question: string }>
): Promise<{ [key: string]: boolean }> {
    try {
        const accessToken = await getAccessToken();
        const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        const clientFolderName = `${sanitizedClientName}_${clientId}`;
        const completionStatus: { [key: string]: boolean } = {};

        for (const question of questions) {
            const sanitizedQuestion = question.question.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
            
            const response = await fetch(
                `${SITE_URL}/drive/root:/${clientFolderName}/${sanitizedQuestion}:/children`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    }
                }
            );

            if (!response.ok) {
                console.error(`Error checking completion for question: ${question.question}`);
                completionStatus[question.question] = false;
                continue;
            }

            const data = await response.json();
            completionStatus[question.question] = data.value && data.value.length > 0;
        }

        return completionStatus;
    } catch (error) {
        console.error('Error in checkQuestionCompletion:', error);
        throw error;
    }
} 