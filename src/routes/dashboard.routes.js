import express from "express";
import { totalLeadsCountInfo } from "../controllers/dashboardController.js";
import { validateOemTotalLeadsQuery } from "../middlewares/dashboardValidator.js";
import { analyticsCount } from "../controllers/dashboardController.js";
import { fetchPlansInfo } from "../controllers/dashboardController.js";
import { getVendorOverview } from "../controllers/dashboardController.js";
import {isAuthenticated} from '../middlewares/isAuthenticated.js'
const router = express.Router();

router.get("/leadsCount",isAuthenticated,totalLeadsCountInfo);
router.get("/analytics", isAuthenticated,analyticsCount);
router.get("/profileOverview",isAuthenticated, getVendorOverview);
router.get("/oemData",isAuthenticated, fetchPlansInfo);

export default router;
