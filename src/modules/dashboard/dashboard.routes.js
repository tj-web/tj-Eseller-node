import express from "express";
import { totalLeadsCountInfo, analyticsCount,fetchPlansInfo,getVendorOverview } from "./dashboard.controller.js";
const router = express.Router();

router.get("/leadsCount", totalLeadsCountInfo);
router.get("/analytics", analyticsCount);
router.get("/profileOverview", getVendorOverview);
router.get("/oemData", fetchPlansInfo);

export default router;
