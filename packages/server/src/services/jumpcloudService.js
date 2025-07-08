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
    if (!user) return { platform: "JumpCloud", status: "Not Found" };

    return {
      platform: "JumpCloud",
      status: user.suspended ? "Suspended" : "Active",
      details: `Username: ${user.username}`,
    };
  } catch (error) {
    return { platform: "JumpCloud", status: "Error", message: error.message };
  }
};

module.exports = {
  suspendUser,
  getUserStatus,
  getUser,
};
