import express from "express";
import { verifyToken, checkAccess } from "../middleware/auth.js";
import { submitBasicForm, submitRealtimeForm } from "../controllers/formController.js";

const router = express.Router();

router.post("/basic", verifyToken, checkAccess('basic'), submitBasicForm);
router.post("/realtime", verifyToken, checkAccess('realtime_validation'), submitRealtimeForm);

export default router;