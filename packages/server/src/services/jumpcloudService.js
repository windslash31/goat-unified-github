const fetch = require('node-fetch');

// This is your original, correct implementation for finding a user's ID
const getJumpcloudUserByEmail = async (email) => {
    if (!process.env.JUMPCLOUD_API_KEY) {
        throw new Error("JumpCloud API key is not configured.");
    }

    const headers = {
        'x-api-key': process.env.JUMPCLOUD_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    // Step 1: Find the user by email to get their ID
    const findUserUrl = `https://console.jumpcloud.com/api/systemusers?filter=email:eq:${encodeURIComponent(email)}`;
    const findUserResponse = await fetch(findUserUrl, { method: 'GET', headers });

    if (!findUserResponse.ok) {
        // This handles API errors like 401 Unauthorized or 500 Server Error
        throw new Error(`JumpCloud API Error (User Search): ${findUserResponse.status}.`);
    }

    const { results: users } = await findUserResponse.json();

    // If no user is found, the 'users' array will be empty
    if (!users || users.length === 0) {
        return null; // Return null to indicate the user was not found
    }

    return users[0]; // Return the full user object
};


const getUserStatus = async (email) => {
    try {
        const user = await getJumpcloudUserByEmail(email);

        // This is the improvement: If the user object is null, they weren't found.
        if (!user) {
            return {
                platform: 'JumpCloud',
                email: email, // Return the email that was searched
                status: 'Not Found',
                message: 'User does not exist in JumpCloud.'
            };
        }

        // If the user is found, use their data to determine the status
        return {
            platform: 'JumpCloud',
            email: user.email,
            status: user.suspended ? 'Suspended' : 'Active',
            message: user.suspended ? 'Account is suspended.' : 'Account is active.'
        };

    } catch (error) {
        // This catches errors from the API call itself (e.g., bad API key)
        console.error("JumpCloud Service Error:", error.message);
        return {
            platform: 'JumpCloud',
            email: email, // Return the email even in case of an error
            status: 'Error',
            message: 'Failed to fetch status from JumpCloud.'
        };
    }
};

const suspendUser = async (email) => {
    // This logic now correctly uses the two-step process
    try {
        const user = await getJumpcloudUserByEmail(email);
        if (!user) {
             return { success: false, message: "User not found in JumpCloud, cannot suspend." };
        }
        
        // In a real implementation, you would use user.id to make the suspension call
        // const suspendUrl = `https://console.jumpcloud.com/api/v2/users/${user.id}`;
        // await fetch(suspendUrl, { method: 'PUT', headers, body: JSON.stringify({ suspended: true }) });

        return { success: true, message: `Suspend action for ${email} (ID: ${user.id}) would be performed here.` };

    } catch(error) {
        console.error("JumpCloud Suspend Error:", error.message);
        return { success: false, message: 'Failed to suspend user in JumpCloud.' };
    }
};

module.exports = {
    getUserStatus,
    suspendUser,
};