import express from "express";
import { planSubscribeRequest } from "./sales.controller.js";

const router = express.Router();

router.post("/plan-subscribe-request", planSubscribeRequest);

export default router;
