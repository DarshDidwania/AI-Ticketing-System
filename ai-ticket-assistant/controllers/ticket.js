import { inngest } from "../inngest/client.js";
import Ticket from "../models/ticket.js";

/**
 * Creates a new support ticket.
 * It saves the ticket to the database and then sends an event to Inngest
 * for background processing (like AI analysis and moderator assignment).
 */
export const createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    // Step 1: Create the ticket in the database
    const newTicket = await Ticket.create({
      title,
      description,
      createdBy: req.user._id.toString(),
    });

    // Step 2: Try to send the Inngest event, but wrap it in its own
    // try/catch block so it doesn't crash the main request.
    try {
      await inngest.send({
        name: "ticket/created",
        data: {
          ticketId: newTicket._id.toString(),
          title,
          description,
          createdBy: req.user._id.toString(),
        },
      });
      console.log("✅ Inngest event for ticket creation sent successfully.");
    } catch (inngestError) {
      // IMPORTANT: Log the Inngest error but don't crash the server.
      // The user's ticket is already saved, which is the most important part.
      console.error("⚠️ Inngest event failed to send, but ticket was created:", inngestError);
    }

    // Step 3: Send a success response to the user
    return res.status(201).json({
      message: "Ticket created successfully!",
      ticket: newTicket,
    });

  } catch (error) {
    // This will catch any errors from the database (Ticket.create())
    console.error("❌ Error creating ticket in database:", error);
    return res.status(500).json({ message: "Failed to save ticket to the database." });
  }
};

/**
 * Fetches all tickets.
 * - Admins/Moderators can see all tickets.
 * - Regular users can only see tickets they have created.
 */
export const getTickets = async (req, res) => {
  try {
    const user = req.user;
    let tickets = [];

    if (user.role !== "user") {
      // Admin/Moderator view: fetch all tickets and populate assigned user details
      tickets = await Ticket.find({})
        .populate("assignedTo", ["email", "_id"])
        .sort({ createdAt: -1 });
    } else {
      // User view: fetch only their own tickets
      tickets = await Ticket.find({ createdBy: user._id })
        .select("title description status createdAt")
        .sort({ createdAt: -1 });
    }
    
    return res.status(200).json({ tickets });
  } catch (error) {
    console.error("Error in getTickets controller:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Fetches a single ticket by its ID.
 * Enforces the same permission rules as getTickets.
 */
export const getTicket = async (req, res) => {
  try {
    const user = req.user;
    let ticket;

    if (user.role !== "user") {
      ticket = await Ticket.findById(req.params.id).populate("assignedTo", [
        "email",
        "_id",
      ]);
    } else {
      ticket = await Ticket.findOne({
        createdBy: user._id,
        _id: req.params.id,
      }).select("title description status createdAt");
    }

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found or you do not have permission to view it." });
    }

    return res.status(200).json({ ticket });
  } catch (error) {
    console.error("Error fetching single ticket:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
