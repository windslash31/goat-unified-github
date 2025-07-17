const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../config/config");
const db = require("../config/db");

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// Data fetching functions (getEmployeeStats, listEmployeesByStatus) remain unchanged.
const getEmployeeStats = async () => {
  const statsQuery = `
        SELECT
            COUNT(*) AS total_employees,
            COUNT(*) FILTER (WHERE get_employee_status(is_active, access_cut_off_date_at_date) = 'Active') AS active_employees,
            COUNT(*) FILTER (WHERE get_employee_status(is_active, access_cut_off_date_at_date) = 'Inactive') AS inactive_employees,
            COUNT(*) FILTER (WHERE get_employee_status(is_active, access_cut_off_date_at_date) = 'For Escalation') AS escalation_employees
        FROM employees;
    `;
  const { rows } = await db.query(statsQuery);
  return rows[0];
};

const listEmployeesByStatus = async (status) => {
  const query = `
        SELECT first_name, last_name FROM employees
        WHERE get_employee_status(is_active, access_cut_off_date_at_date) = $1
        ORDER BY first_name
        LIMIT 10;
    `;
  const { rows } = await db.query(query, [status]);
  return rows.map((r) => `${r.first_name} ${r.last_name}`);
};

const getResponse = async (history) => {
  const systemInstruction =
    "You are G.O.A.T., a helpful AI assistant for an internal company tool. Be concise and friendly. Based on the provided data, answer the user's question.";

  const latestUserMessage = history[history.length - 1];
  const latestPrompt = latestUserMessage.text;
  const lowerCasePrompt = latestPrompt.toLowerCase();

  let context = "";
  if (
    lowerCasePrompt.includes("how many") ||
    lowerCasePrompt.includes("count") ||
    lowerCasePrompt.includes("stats")
  ) {
    const stats = await getEmployeeStats();
    context = `Data: Total employees: ${stats.total_employees}. Active: ${stats.active_employees}. Inactive: ${stats.inactive_employees}. For Escalation: ${stats.escalation_employees}.`;
  } else if (
    lowerCasePrompt.startsWith("list") ||
    lowerCasePrompt.startsWith("who are")
  ) {
    let status = "Active";
    if (lowerCasePrompt.includes("inactive")) status = "Inactive";
    if (lowerCasePrompt.includes("escalation")) status = "For Escalation";

    const employees = await listEmployeesByStatus(status);
    if (employees.length > 0) {
      context = `Data: Here are up to 10 employees with status '${status}': ${employees.join(
        ", "
      )}.`;
    } else {
      context = `Data: There are no employees with the status '${status}'.`;
    }
  } else {
    return "I can answer questions about employee statistics (e.g., 'how many active employees?') or list employees by status (e.g., 'list inactive employees'). How can I help?";
  }

  // --- MODIFIED SECTION: Ensure history starts with a 'user' role ---
  // 1. Find the index of the first message sent by the user.
  const firstUserMessageIndex = history.findIndex((msg) => msg.from === "user");

  // 2. If no user message is found (which shouldn't happen with our frontend logic), send an empty history.
  if (firstUserMessageIndex === -1) {
    // This case should not be hit if the frontend sends at least one user message.
    // We handle it defensively.
    const result = await model.generateContent(
      `${systemInstruction}\n\nContext: ${context}\n\nUser's question: "${latestPrompt}"`
    );
    return result.response.text();
  }

  // 3. Create the history slice, starting from the first user message.
  const validHistorySlice = history.slice(firstUserMessageIndex, -1);

  const geminiHistory = validHistorySlice.map((msg) => ({
    role: msg.from === "bot" ? "model" : "user",
    parts: [{ text: msg.text }],
  }));
  // --- END OF MODIFIED SECTION ---

  const chat = model.startChat({
    history: geminiHistory,
    generationConfig: {
      maxOutputTokens: 200,
    },
  });

  const finalPrompt = `Context: ${context}\n\nUser's question: "${latestPrompt}"`;

  const result = await chat.sendMessage(finalPrompt);
  const response = result.response;

  return response.text();
};

module.exports = {
  getResponse,
};
