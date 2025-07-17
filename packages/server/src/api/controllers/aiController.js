const aiService = require("../../services/aiService");

/**
 * Handles the /ask endpoint.
 */
const ask = async (req, res, next) => {
  try {
    // --- MODIFIED: Expect 'history' array instead of 'prompt' ---
    const { history } = req.body;
    if (!history || !Array.isArray(history) || history.length === 0) {
      return res
        .status(400)
        .json({ message: "A valid conversation history is required." });
    }

    const response = await aiService.getResponse(history);
    res.json({ response });
  } catch (error) {
    console.error("Error in AI controller:", error);
    next(error); // Pass to global error handler
  }
};

module.exports = {
  ask,
};
