import express from "express";
import { parseVoiceExpense } from "../controller/voiceExpense/voiceExpense.js";
import { authenticate } from "../middleware/auth.js";

const voiceExpenseRoutes = express.Router();

voiceExpenseRoutes.post("/", authenticate, parseVoiceExpense);

export default voiceExpenseRoutes;
