const { WebClient } = require('@slack/web-api');

// Throw an error at startup if the token is missing from the .env file.
if (!process.env.SLACK_BOT_TOKEN) {
    throw new Error("Slack Bot Token is not defined. Please set SLACK_BOT_TOKEN in your .env file.");
}

const web = new WebClient(process.env.SLACK_BOT_TOKEN);

const getUserStatus = async (email) => {
    if (!email) {
        return { platform: 'Slack', email: 'N/A', status: 'Error', message: 'No email provided.' };
    }

    try {
        const result = await web.users.lookupByEmail({ email });
        if (result.ok && result.user) {
            return {
                platform: 'Slack',
                email: result.user.profile.email || email,
                status: result.user.deleted ? 'Suspended' : 'Active',
                message: result.user.deleted ? 'Account is deactivated.' : 'Account is active.'
            };
        }
        throw new Error('User found but data is incomplete.');
    } catch (error) {
        if (error.code === 'slack_webapi_platform_error' && error.data.error === 'users_not_found') {
            return { platform: 'Slack', email, status: 'Not Found', message: 'User does not exist in Slack.' };
        }
        console.error("Slack API Error:", error.message);
        return { platform: 'Slack', email, status: 'Error', message: 'Failed to fetch status from Slack.' };
    }
};

const deactivateUser = async (email) => {
    try {
        const result = await web.users.lookupByEmail({ email });
        if (result.ok && result.user) {
            // Placeholder for admin.users.setInactive
            return { success: true, message: `Deactivation for ${email} would be performed here.` };
        }
        return { success: false, message: "User not found, could not deactivate."};
    } catch(error) {
         if (error.data?.error === 'users_not_found') {
            return { success: false, message: "User not found, could not deactivate."};
        }
        console.error(`Failed to deactivate user ${email} in Slack:`, error.message);
        return { success: false, message: 'An error occurred during deactivation.' };
    }
};

module.exports = {
    getUserStatus,
    deactivateUser,
};