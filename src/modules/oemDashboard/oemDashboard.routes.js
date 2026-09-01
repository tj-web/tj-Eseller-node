import express from "express";
import {
    getProducts,
    getSummary,
    getImpressionsTrend,
    getOpportunitiesTrend,
} from "./oemDashboard.controller.js";

const router = express.Router();

router.get("/products", getProducts);
router.get("/summary", getSummary);
router.get("/impressions-trend", getImpressionsTrend);
router.get("/opportunities-trend", getOpportunitiesTrend);

export default router;
