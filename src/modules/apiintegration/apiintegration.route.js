import express from "express";
import { createWebhook, verifyWebhook, apiIntegrationPlanRequest } from "./apiintegration.controller.js";

const router = express.Router();

router.post("/create-webhook", createWebhook);
router.post("/verify-webhook", verifyWebhook);
router.post("/plan-request", apiIntegrationPlanRequest);

export default router;
