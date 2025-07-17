const aiService = require("../../services/aiService");


const ask = async (req, res, next) => {
  try {
    const { history } = req.body;
    if (!history || !Array.isArray(history) || history.length === 0) {
      return res
    const { message } = req.body;
    if (!message || !Array.isArray(message) || message.length === 0) {
      return res
        .status(400)
        .json({ message: "A valid conversation history is required." });
    }

    const response = await aiService.getResponse(message);
    next(error); // Pass to global error handler
  }
};

module.exports = {
  ask,
};
