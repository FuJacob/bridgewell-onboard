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
        // Get access token
        let accessToken;
        try {
            accessToken = await getAccessToken();
        } catch (tokenError) {
            console.error('Error getting access token:', tokenError);
            throw new Error('Authentication failed. Please try again later.');
        }
        
        const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        const clientFolderName = `${sanitizedClientName}_${clientId}`;
        console.log("Client folder name for upload:", clientFolderName);
        console.log("Using clientId:", clientId);

        // Ensure the path includes CLIENTS as the root folder
        const fullPath = `CLIENTS/${clientFolderName}/${filePath}`;
        console.log("Uploading file to path:", fullPath);
        
        // Check file size
        const fileSizeInMB = fileContent.size / (1024 * 1024);
        if (fileSizeInMB > 25) { // 25MB limit
            throw new Error('File size exceeds the maximum allowed (25MB). Please upload a smaller file.');
        }

        try {
            const response = await fetch(
                `${SITE_URL}/drive/root:/${fullPath}:/content`,
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
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Permission denied while uploading file. Please contact support.');
                } else if (response.status === 404) {
                    throw new Error('Destination folder not found. Please try again or contact support.');
                } else if (response.status === 413) {
                    throw new Error('File is too large. Please upload a smaller file.');
                } else if (response.status >= 500) {
                    throw new Error('Server error. Please try again later.');
                }
                
                const error = await response.json();
                console.error('Error uploading file:', error);
                throw new Error(`Upload failed: ${error.message || error.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            console.log("File uploaded successfully with ID:", data.id);
            return data.id;
        } catch (fetchError: any) {
            // Handle fetch-specific errors
            if (fetchError.name === 'AbortError') {
                throw new Error('Upload was aborted. Please try again.');
            } else if (fetchError.name === 'TypeError' && fetchError.message.includes('NetworkError')) {
                throw new Error('Network error. Please check your internet connection and try again.');
            } else {
                throw fetchError; // Re-throw other errors
            }
        }
    } catch (error) {
        console.error('Error in uploadFileToClientFolder:', error);
        if (error instanceof Error) {
            throw error; // Re-throw the error with its message intact
        } else {
            throw new Error('Failed to upload file due to an unexpected error');
        }
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
        console.log("Client folder name for checking completion:", clientFolderName);
        console.log("Using clientId for completion check:", clientId);
        
        const completionStatus: { [key: string]: boolean } = {};

        for (const question of questions) {
            const sanitizedQuestion = question.question.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
            const checkPath = `CLIENTS/${clientFolderName}/${sanitizedQuestion}`;
            console.log("Checking completion for path:", checkPath);
            
            const response = await fetch(
                `${SITE_URL}/drive/root:/${checkPath}:/children`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                // If the folder has any items (files), consider the question completed
                completionStatus[question.question] = data.value && data.value.length > 0;
                console.log(`Question "${question.question}" completion:`, completionStatus[question.question], 
                           data.value ? `(${data.value.length} files found)` : "(no files)");
            } else {
                console.error(`Error checking folder for question: ${question.question}`, response.status);
                completionStatus[question.question] = false;
            }
        }

        return completionStatus;
    } catch (error) {
        console.error('Error in checkQuestionCompletion:', error);
        return {};
    }
} 