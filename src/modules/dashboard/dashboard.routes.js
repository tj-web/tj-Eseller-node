import express from "express";
import { totalLeadsCountInfo } from "./dashboardController.js";
import { validateOemTotalLeadsQuery } from "../../middlewares/dashboardValidator.js";
import { analyticsCount } from "./dashboardController.js";
import { fetchPlansInfo } from "./dashboardController.js";
import { getVendorOverview } from "./dashboardController.js";
const router = express.Router();

router.get("/leadsCount", totalLeadsCountInfo);
router.get("/analytics", analyticsCount);
router.get("/profileOverview", getVendorOverview);
router.get("/oemData", fetchPlansInfo);

export default router;
