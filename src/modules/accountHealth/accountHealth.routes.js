import express from "express";
import { getAccountHealth } from "./accountHealthController.js";
const router = express.Router();

router.get("/status", getAccountHealth);


export default router;