import { inngest } from "../inngest/client.js";
import Ticket from "../models/ticket.js";

export const createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    const newTicket = await Ticket.create({
      title,
      description,
      createdBy: req.user._id.toString(),
    });

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
      console.error("⚠️ Inngest event failed to send, but ticket was created:", inngestError);
    }

    return res.status(201).json({
      message: "Ticket created successfully!",
      ticket: newTicket,
    });

  } catch (error) {
    console.error("❌ Error creating ticket in database:", error);
    return res.status(500).json({ message: "Failed to save ticket to the database." });
  }
};

export const getTickets = async (req, res) => {
  console.log(`--- getTickets Controller Reached ---`);
  console.log(`Fetching tickets for user: ${req.user.email} (Role: ${req.user.role})`);
  try {
    const user = req.user;
    let tickets = [];
    if (user.role !== "user") {
      tickets = await Ticket.find({}).populate("assignedTo", ["email", "_id"]).sort({ createdAt: -1 });
    } else {
      // Return additional AI-updated fields to the ticket owner so the frontend
      // can display priority, helpfulNotes, relatedSkills and assignedTo
      tickets = await Ticket.find({ createdBy: user._id })
        .select("title description status createdAt priority helpfulNotes relatedSkills assignedTo")
        .populate("assignedTo", ["email", "_id"]).sort({ createdAt: -1 });
    }
    console.log(`Found ${tickets.length} tickets for user.`);
    return res.status(200).json({ tickets });
  } catch (error) {
    console.error("Error in getTickets controller:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

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
      // Return additional AI-updated fields to the ticket owner and populate
      // assignedTo so the frontend can show the assigned user's email.
      ticket = await Ticket.findOne({
        createdBy: user._id,
        _id: req.params.id,
      })
        .select("title description status createdAt priority helpfulNotes relatedSkills assignedTo")
        .populate("assignedTo", ["email", "_id"]);
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
