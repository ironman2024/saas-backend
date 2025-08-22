import express from "express";
import { verifyToken, checkRole } from "../middleware/auth.js";
import { 
  createSupportTicket, 
  getUserTickets, 
  updateTicketStatus 
} from "../controllers/supportController.js";

const router = express.Router();

router.post("/create", verifyToken, createSupportTicket);
router.get("/tickets", verifyToken, getUserTickets);
router.put("/tickets/:ticketId/status", verifyToken, checkRole(['admin']), updateTicketStatus);

export default router;