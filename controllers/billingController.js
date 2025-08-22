import db from "../config/db.js";

// Generate invoice number
const generateInvoiceNumber = () => {
  const timestamp = Date.now();
  return `INV-${timestamp}`;
};

// Create invoice
export const createInvoice = async (req, res) => {
  const { amount, taxRate = 18, dueDate } = req.body;

  if (!amount || !dueDate) {
    return res.status(400).json({ message: "Amount and due date are required" });
  }

  try {
    const taxAmount = (amount * taxRate) / 100;
    const totalAmount = amount + taxAmount;
    const invoiceNumber = generateInvoiceNumber();

    const [result] = await db.query(
      "INSERT INTO invoices (user_id, invoice_number, amount, tax_amount, total_amount, due_date) VALUES (?, ?, ?, ?, ?, ?)",
      [req.user.id, invoiceNumber, amount, taxAmount, totalAmount, dueDate]
    );

    res.status(201).json({
      message: "Invoice created successfully",
      invoiceId: result.insertId,
      invoiceNumber,
      totalAmount
    });
  } catch (error) {
    console.error("Create Invoice Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user invoices
export const getUserInvoices = async (req, res) => {
  try {
    const [invoices] = await db.query(
      "SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );

    res.json(invoices);
  } catch (error) {
    console.error("Get Invoices Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get invoice details
export const getInvoiceDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const [invoice] = await db.query(`
      SELECT i.*, u.name, u.email 
      FROM invoices i 
      JOIN users u ON i.user_id = u.user_id 
      WHERE i.invoice_id = ? AND i.user_id = ?
    `, [id, req.user.id]);

    if (invoice.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json(invoice[0]);
  } catch (error) {
    console.error("Get Invoice Details Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark invoice as paid
export const markInvoicePaid = async (req, res) => {
  const { id } = req.params;
  const { paymentRef } = req.body;

  try {
    await db.query(
      "UPDATE invoices SET status = 'paid' WHERE invoice_id = ?",
      [id]
    );

    res.json({ message: "Invoice marked as paid" });
  } catch (error) {
    console.error("Mark Invoice Paid Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get billing reports (admin only)
export const getBillingReports = async (req, res) => {
  try {
    const [totalRevenue] = await db.query(
      "SELECT SUM(total_amount) as total FROM invoices WHERE status = 'paid'"
    );

    const [monthlyRevenue] = await db.query(`
      SELECT MONTH(created_at) as month, YEAR(created_at) as year, SUM(total_amount) as revenue
      FROM invoices 
      WHERE status = 'paid' AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY year DESC, month DESC
    `);

    const [pendingInvoices] = await db.query(
      "SELECT COUNT(*) as count, SUM(total_amount) as amount FROM invoices WHERE status = 'pending'"
    );

    res.json({
      totalRevenue: totalRevenue[0].total || 0,
      monthlyRevenue,
      pendingInvoices: pendingInvoices[0]
    });
  } catch (error) {
    console.error("Billing Reports Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};