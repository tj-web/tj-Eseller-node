import express from "express";
import { createWebhook, verifyWebhook } from "./apiintegration.controller.js";

const router = express.Router();

router.post("/create-webhook", createWebhook);
router.post("/verify-webhook", verifyWebhook);

export default router;
