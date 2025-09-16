import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js";
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";
import analyzeTicket from "../../utils/ai.js";

/**
 * This is an Inngest background function that triggers whenever a 'ticket/created' event is received.
 * It orchestrates the entire ticket processing pipeline asynchronously.
 */
export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 2 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;
      console.log(`[Inngest] Starting processing for ticketId: ${ticketId}`);

      // Step 1: Fetch the newly created ticket from the database.
      const ticket = await step.run("fetch-ticket", async () => {
        const ticketObject = await Ticket.findById(ticketId);
        if (!ticketObject) {
          // If the ticket doesn't exist, don't retry. It's a permanent failure.
          throw new NonRetriableError("Ticket not found in the database.");
        }
        console.log("[Inngest] Fetched ticket successfully.");
        return ticketObject;
      });

      // Step 2: Perform AI analysis on the ticket content.
      // NOTE: Run the AI analysis outside of `step.run` to avoid nesting Inngest
      // `step.*` tooling. Some AI libraries/instrumentation may themselves use
      // Inngest tooling which can trigger the NESTING_STEPS warning when
      // wrapped inside a `step.run` call.
      let aiResponse = null;
      try {
        console.log("[Inngest] Attempting AI analysis...");
        const response = await analyzeTicket(ticket);
        if (!response) {
          console.error("[Inngest] AI analysis returned a null or empty response. Check ai.js or Gemini API key.");
          aiResponse = null;
        } else {
          console.log("[Inngest] AI analysis successful.");
          // Log parsed AI response for debugging so we can confirm its shape.
          console.log("[Inngest] Parsed AI response:", response);
          aiResponse = response;
        }
      } catch (aiError) {
        console.error("❌ CRITICAL INGEST ERROR: The AI analysis step failed.", aiError);
        aiResponse = null; // Allow processing to continue without AI data.
      }

      // Step 3: Update the ticket with data from the AI analysis if it was successful.
      if (aiResponse) {
        await step.run("update-ticket-with-ai-data", async () => {
          console.log("[Inngest] Updating ticket with AI data. ticket._id:", ticket._id);
          const updateResult = await Ticket.findByIdAndUpdate(
            ticket._id,
            {
              priority: !["low", "medium", "high"].includes(aiResponse.priority) ? "medium" : aiResponse.priority,
              helpfulNotes: aiResponse.helpfulNotes,
              status: "IN_PROGRESS",
              relatedSkills: aiResponse.relatedSkills,
            },
            { new: true }
          );
          console.log("[Inngest] findByIdAndUpdate result:", updateResult);
          console.log("[Inngest] Updated ticket with AI data.");
        });
      }

      // Step 4: Assign the ticket to the best available moderator based on skills.
      // If no skilled moderator is found, assign it to an admin.
      const moderator = await step.run("assign-moderator", async () => {
        const skills = aiResponse?.relatedSkills || [];
        let user;
        if (skills.length > 0) {
          user = await User.findOne({
            role: "moderator",
            // Find a moderator who has at least one of the required skills
            skills: { $in: skills.map(s => new RegExp(s, 'i')) },
          });
        }
        // If no skilled moderator is found, fall back to any admin.
        if (!user) {
          user = await User.findOne({ role: "admin" });
        }
        await Ticket.findByIdAndUpdate(ticket._id, { assignedTo: user?._id || null });
        console.log(`[Inngest] Assigned ticket to: ${user ? user.email : 'unassigned'}`);
        return user;
      });

      // Step 5: Send an email notification to the assigned moderator/admin.
      // This is also wrapped in a try/catch to prevent mailer errors from crashing the function.
      if (moderator) {
        await step.run("send-email-notification", async () => {
          try {
            await sendMail(
              moderator.email,
              `New Ticket Assigned: ${ticket.title}`,
              `A new ticket has been assigned to you. Title: ${ticket.title}\n\nPlease review it in the admin panel.`
            );
            console.log(`[Inngest] Sent email notification to ${moderator.email}.`);
          } catch (mailError) {
             console.error("❌ CRITICAL INGEST ERROR: Failed to send email. Check Mailtrap credentials in .env file.", mailError);
          }
        });
      }

      console.log(`[Inngest] Successfully finished processing for ticketId: ${ticketId}`);
      return { success: true };

    } catch (err) {
      // This is a final catch-all for any other unexpected errors in the function.
      console.error("❌ A fatal error occurred in the main on-ticket-created function:", err.message);
      return { success: false, error: err.message };
    }
  }
);
