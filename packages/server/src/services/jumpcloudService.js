const fetch = require("node-fetch");

const BASE_URL = "https://console.jumpcloud.com/api";
const API_KEY = process.env.JUMPCLOUD_API_KEY;

const getUser = async (email) => {
  if (!API_KEY) throw new Error("JumpCloud API key is not configured.");
  const url = `${BASE_URL}/systemusers?filter=email:eq:${encodeURIComponent(
    email
  )}`;
  const response = await fetch(url, {
    headers: { "x-api-key": API_KEY, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`JumpCloud API Error: ${response.statusText}`);
  }
  const { results } = await response.json();
  return results.length > 0 ? results[0] : null;
};

const suspendUser = async (email) => {
  try {
    const user = await getUser(email);
    if (!user) {
      return {
        success: false,
        message: `User ${email} not found in JumpCloud.`,
      };
    }
    const url = `${BASE_URL}/systemusers/${user.id}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ suspended: true }),
    });
    if (!response.ok) {
      throw new Error(`JumpCloud API Error: ${response.statusText}`);
    }
    return { success: true, message: `User ${email} suspended in JumpCloud.` };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const getUserStatus = async (email) => {
  try {
    const user = await getUser(email);
    if (!user) {
      return {
        platform: "JumpCloud",
        status: "Not Found",
        email: email,
        details: { message: "User not found in JumpCloud." },
      };
    }

    const details = {
      coreIdentity: {
        displayName: user.displayname,
        username: user.username,
        email: user.email,
        id: user._id,
      },
      accountStatus: {
        state: user.state,
        activated: user.activated,
        suspended: user.suspended,
        accountLocked: user.account_locked,
        passwordExpired: user.password_expired,
        mfaStatus: user.mfaEnrollment?.overallStatus,
      },
      permissions: {
        isAdmin: user.admin ? "Yes" : "No",
        hasSudo: user.sudo ? "Yes" : "No",
      },
    };

    return {
      platform: "JumpCloud",
      email: user.email,
      status: user.suspended ? "Suspended" : "Active",
      details: details,
    };
  } catch (error) {
    return {
      platform: "JumpCloud",
      status: "Error",
      email: email,
      details: { message: error.message },
    };
  }
};

const getSystemAssociations = async (userId) => {
  if (!API_KEY) {
    throw new Error("JumpCloud API key is not configured.");
  }
  const url = `https://console.jumpcloud.com/api/v2/users/${userId}/associations?targets=system`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
  });
  if (!response.ok) {
    throw new Error(`JumpCloud API Error: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
};

const getSystemDetails = async (systemId) => {
  if (!API_KEY) {
    throw new Error("JumpCloud API key is not configured.");
  }
  const url = `https://console.jumpcloud.com/api/systems/${systemId}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
  });
  if (!response.ok) {
    throw new Error(`JumpCloud API Error: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
};

module.exports = {
  suspendUser,
  getUserStatus,
  getUser,
  getSystemAssociations,
  getSystemDetails,
};
