import express from "express";
import { getAccountHealth } from "../controllers/accountHealthController.js";
const router = express.Router();

router.get("/status", getAccountHealth);


export default router;