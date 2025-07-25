import express from "express";
import { totalLeadsCountInfo } from "../controllers/dashboardController.js";
const router = express.Router();

router.get("/leadsCount", totalLeadsCountInfo);

export default router;
