import express from "express";
import { getAccountHealth } from "./accountHealth.controller.js";
const router = express.Router();

router.get("/status", getAccountHealth);


export default router;