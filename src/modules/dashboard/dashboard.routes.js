import express from "express";
<<<<<<< HEAD
import {
    totalLeadsCountInfo,
    analyticsCount,
    fetchPlansInfo,
    getVendorOverview,
    getDashboardStats,
}   from "./dashboard.controller.js";
=======
import { totalLeadsCountInfo, analyticsCount,fetchPlansInfo,getVendorOverview } from "./dashboard.controller.js";
>>>>>>> main
const router = express.Router();

router.get("/leadsCount", totalLeadsCountInfo);
router.get("/analytics", analyticsCount);
router.get("/profileOverview", getVendorOverview);
router.get("/oemData", fetchPlansInfo);
router.get("/dashboardStats", getDashboardStats);

export default router;
