import express from "express";
import { planSubscribeRequest, fetchPlansInfo } from "./sales.controller.js";

const router = express.Router();

router.post("/plan-subscribe-request", planSubscribeRequest);
router.get("/oemData", fetchPlansInfo);

export default router;
