const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../config/config");
const { tools, toolDefinitions } = require("./aiTools");

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  systemInstruction:
    "You are G.O.A.T., a helpful and friendly AI assistant for an internal company tool. Your primary function is to provide information about employees and Jira tickets by using the tools available to you. Be concise in your answers. Do not make up information; only use the data provided by the tools.",
  tools: [{ functionDeclarations: toolDefinitions }],
});

const getResponse = async (history) => {
  const latestUserMessage = history[history.length - 1];

  const firstUserMessageIndex = history.findIndex((msg) => msg.from === "user");
  if (firstUserMessageIndex === -1) {
    const result = await model.generateContent(latestUserMessage.text);
    return result.response.text();
  }

  const validHistorySlice = history.slice(firstUserMessageIndex, -1);
  const chat = model.startChat({
    history: validHistorySlice.map((msg) => ({
      role: msg.from === "bot" ? "model" : "user",
      parts: [{ text: msg.text }],
    })),
  });

  let result = await chat.sendMessage(latestUserMessage.text);

  // This loop is now corrected to handle the tool-calling flow properly.
  while (true) {
    const call = result.response.functionCalls()?.[0];
    if (!call) {
      // If there are no more function calls, break the loop and return the text.
      return result.response.text();
    }

    console.log(`AI is calling tool: ${call.name}`, call.args);
    const toolResult = await tools[call.name]?.(call.args);

    // --- THIS IS THE FIX ---
    // Send the specific function call and its result back to the model.
    // Do not create the 'functionResponse' object manually.
    result = await chat.sendMessage([
      {
        functionCall: call,
        functionResponse: {
          response: toolResult,
        },
      },
    ]);
    // --- END OF FIX ---
  }
};

module.exports = {
  getResponse,
};
