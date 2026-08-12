import express from "express";
import { createWebhook, verifyWebhook, apiIntegrationPlanRequest, updateLeadAction, getLeadActionConfig, addLeadRemark } from "./apiintegration.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { vendorModeMiddleware } from "../../middlewares/vendorModeMiddleware.js";

const router = express.Router();

router.post("/create-webhook", authenticate, vendorModeMiddleware, createWebhook);
router.post("/verify-webhook", authenticate, vendorModeMiddleware, verifyWebhook);
router.post("/plan-request", authenticate, vendorModeMiddleware, apiIntegrationPlanRequest);
router.get("/lead-action-config", authenticate, vendorModeMiddleware, getLeadActionConfig);
router.post("/update-lead-action", updateLeadAction);
router.post("/add-lead-remark", addLeadRemark);

export default router;


