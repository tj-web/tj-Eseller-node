import express from "express";
import { totalLeadsCountInfo, analyticsCount, getVendorOverview, getDashboardStats } from "./dashboard.controller.js";
const router = express.Router();

router.get("/leadsCount", totalLeadsCountInfo);
router.get("/analytics", analyticsCount);
router.get("/profileOverview", getVendorOverview);
router.get("/dashboardStats", getDashboardStats);

export default router;
