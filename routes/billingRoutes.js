import express from "express";
import { verifyToken, checkRole } from "../middleware/auth.js";
import { 
  createInvoice, 
  getUserInvoices, 
  getInvoiceDetails, 
  markInvoicePaid,
  getBillingReports 
} from "../controllers/billingController.js";

const router = express.Router();

router.post("/invoice", verifyToken, createInvoice);
router.get("/invoices", verifyToken, getUserInvoices);
router.get("/invoice/:id", verifyToken, getInvoiceDetails);
router.put("/invoice/:id/paid", verifyToken, markInvoicePaid);
router.get("/reports", verifyToken, checkRole(['admin']), getBillingReports);

export default router;