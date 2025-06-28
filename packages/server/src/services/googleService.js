const { google } = require('googleapis');
const { OAuth2 } = google.auth;

let googleAdminClient;

/**
 * Creates an authenticated Google Admin SDK client using OAuth 2.0.
 * This method is correct for your setup using a refresh token.
 */
async function getAuthenticatedClient() {
    // Return the existing client if it's already been created
    if (googleAdminClient) {
        return googleAdminClient;
    }

    // Check if the required environment variables for OAuth 2.0 are set
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
        throw new Error("Google OAuth 2.0 environment variables are not set. Please check your .env file for GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.");
    }

    try {
        // Create a new OAuth2 client with your credentials
        const oauth2Client = new OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            // The redirect URL is not used in this server-to-server flow but is often required
            'urn:ietf:wg:oauth:2.0:oob' 
        );

        // Set the refresh token to the client
        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        });

        // The googleapis library will automatically use the refresh token to get a new access token
        googleAdminClient = google.admin({
            version: 'directory_v1',
            auth: oauth2Client,
        });

        return googleAdminClient;

    } catch (error) {
        console.error("Failed to create Google OAuth2 authenticated client:", error.message);
        throw new Error("Google authentication setup failed. Check your OAuth 2.0 credentials.");
    }
}


const getUserStatus = async (email) => {
    try {
        const directory = await getAuthenticatedClient();
        
        const response = await directory.users.get({
            userKey: email,
            fields: 'suspended,primaryEmail',
        });
        
        const userData = response.data;

        return {
            platform: 'Google Workspace',
            email: userData.primaryEmail,
            status: userData.suspended ? 'Suspended' : 'Active',
            message: userData.suspended ? 'Account is suspended.' : 'Account is active.'
        };

    } catch (error) {
        if (error.code === 404) {
            return {
                platform: 'Google Workspace',
                email: email,
                status: 'Not Found',
                message: 'User does not exist in Google Workspace.'
            };
        }
        console.error("Google Workspace Error:", error.message);
        return {
            platform: 'Google Workspace',
            email: email,
            status: 'Error',
            message: 'Failed to fetch status from Google Workspace.'
        };
    }
};

const suspendUser = async (email) => {
    try {
        const directory = await getAuthenticatedClient();
        await directory.users.update({
            userKey: email,
            requestBody: {
                suspended: true
            }
        });
        return { success: true, message: `Successfully suspended ${email} in Google Workspace.` };
    } catch (error) {
        console.error(`Failed to suspend user ${email} in Google Workspace:`, error.message);
        return { success: false, message: 'Failed to suspend user in Google Workspace.' };
    }
};

const getLoginEvents = async (email) => {
    try {
        const admin = await getAuthenticatedClient();
        const reports = google.reports({
            version: 'reports_v1',
            auth: admin.auth,
        });

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const response = await reports.activities.list({
            userKey: email,
            applicationName: 'login',
            startTime: thirtyDaysAgo,
        });

        return response.data.items || [];
    } catch (error) {
        console.error(`Failed to get Google Workspace login events for ${email}:`, error.message);
        return []; // Return empty array on error
    }
};

module.exports = {
    getUserStatus,
    suspendUser,
    getLoginEvents, // Export the new function
};