import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoutes from "./routes/user.js";
import ticketRoutes from "./routes/ticket.js";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js";
import { onTicketCreated } from "./inngest/functions/on-ticket-create.js";
import { onUserSignup } from "./inngest/functions/on-signup.js";

dotenv.config();

// --- CRITICAL: CATCH ALL UNHANDLED ERRORS ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('FATAL: Uncaught Exception:', error);
  process.exit(1);
});
// --- END CRITICAL ERROR HANDLING ---

const app = express();

// --- MANUAL & ROBUST CORS CONFIGURATION ---
// This middleware replaces the 'cors' package for more explicit control.
// It MUST be the very first middleware.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle the browser's preflight request.
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});
// --- END CORS CONFIGURATION ---

app.use(express.json());

// --- NEW: SERVER HEALTH CHECK ROUTE ---
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Backend is running!" });
});
// --- END HEALTH CHECK ---

app.use("/auth", userRoutes);
app.use("/tickets", ticketRoutes);

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [onTicketCreated, onUserSignup],
  })
);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Server running on port: ${PORT}`));
  })
  .catch((error) => {
    console.error("❌ DATABASE CONNECTION FAILED:", error.message);
  });
