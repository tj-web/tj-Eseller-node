import express from "express";
import {
    totalLeadsCountInfo,
    analyticsCount,
    fetchPlansInfo,
    getVendorOverview,
    getDashboardStats,
}   from "./dashboard.controller.js";
const router = express.Router();

router.get("/leadsCount", totalLeadsCountInfo);
router.get("/analytics", analyticsCount);
router.get("/profileOverview", getVendorOverview);
router.get("/oemData", fetchPlansInfo);
router.get("/dashboardStats", getDashboardStats);

export default router;
