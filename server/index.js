import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import voiceExpenseRoutes from "./routes/voiceExpenseRoutes.js";

// DOTENV CONFIG
dotenv.config();

//INTIALIZERS
const app = express();

// EXPRESS APP
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

//ENV VARIABLES
const PORT = process.env.SERVER_PORT;

// DATABASE CONNECTION

// APP ROUTES
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Connecting to our server...",
  });
});

app.use("/api/v1", routes);
app.use("/api/voice-expense", voiceExpenseRoutes);

// FUNCTIONS
app.listen(PORT, () => {
  try {
    console.log("Server running on the port " + PORT);
  } catch (err) {
    console.log("Error while running the server " + err);
  }
});
