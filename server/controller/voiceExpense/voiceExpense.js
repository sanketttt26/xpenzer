import response from "../../helpers/response.js";
import voiceExpense from "../../services/voiceExpense.js";

export const parseVoiceExpense = async (req, res) => {
  const { text, language } = req.body;

  if (typeof text !== "string" || !text.trim()) {
    return response.badRequest(res, "Please provide transcript text to parse", {
      missingFields: ["text"],
    });
  }

  try {
    const result = voiceExpense.parse(text, language);
    return response.ok(res, result, "Voice expense parsed successfully");
  } catch (error) {
    console.log(error);
    return response.serverError(res);
  }
};
