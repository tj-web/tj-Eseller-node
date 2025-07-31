import express from "express";
import { totalLeadsCountInfo } from "../controllers/dashboardController.js";
import {validateOemTotalLeadsQuery} from '../middlewares/dashboardValidator.js'
import { analyticsCount } from "../controllers/dashboardAnalytics.js";
const router = express.Router();

router.get("/leadsCount",totalLeadsCountInfo);
router.get("/analytics",analyticsCount)

export default router;
