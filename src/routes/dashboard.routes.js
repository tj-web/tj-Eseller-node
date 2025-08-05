import express from "express";
import { totalLeadsCountInfo } from "../controllers/dashboardController.js";
import { validateOemTotalLeadsQuery } from "../middlewares/dashboardValidator.js";
import { analyticsCount } from "../controllers/dashboardController.js";
import { fetchPlansInfo } from "../controllers/oemController.js";
import { getVendorOverview } from "../controllers/dashboardController.js";
const router = express.Router();

router.get("/leadsCount", totalLeadsCountInfo);
router.get("/analytics", analyticsCount);
router.get("/profileOverview", getVendorOverview);
router.get("/oemData", fetchPlansInfo);

export default router;
