import db from "../config/db.js";

// Create support ticket
export const createSupportTicket = async (req, res) => {
  const { subject, description, priority = 'medium' } = req.body;

  if (!subject || !description) {
    return res.status(400).json({ message: "Subject and description are required" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO support_tickets (user_id, subject, description, priority, status) VALUES (?, ?, ?, ?, 'open')",
      [req.user.id, subject, description, priority]
    );

    res.json({
      message: "Support ticket created successfully",
      ticketId: result.insertId
    });
  } catch (error) {
    console.error("Create Ticket Error:", error);
    res.status(500).json({ message: "Failed to create support ticket" });
  }
};

// Get user tickets
export const getUserTickets = async (req, res) => {
  try {
    const [tickets] = await db.query(
      "SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );

    res.json(tickets);
  } catch (error) {
    console.error("Get Tickets Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update ticket status (admin only)
export const updateTicketStatus = async (req, res) => {
  const { ticketId } = req.params;
  const { status } = req.body;

  const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    await db.query(
      "UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE ticket_id = ?",
      [status, ticketId]
    );

    res.json({ message: "Ticket status updated successfully" });
  } catch (error) {
    console.error("Update Ticket Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};