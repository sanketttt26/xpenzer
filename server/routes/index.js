import { Router } from "express";
import spendingRoutes from "./spendingRoutes.js";
import userRoutes from "./userRoutes.js";
import friendRoutes from "./friendRoutes.js";
import groupRoutes from "./groupRoutes.js";
import voiceExpenseRoutes from "./voiceExpenseRoutes.js";

const routes = Router();

routes.use("/spendings", spendingRoutes);
routes.use("/voice-expense", voiceExpenseRoutes);
routes.use("/users", userRoutes);
routes.use("/friends", friendRoutes);
routes.use("/groups", groupRoutes);

export default routes;
