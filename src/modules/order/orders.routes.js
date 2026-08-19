import express from "express";
import { getOrders } from "./orders.controller.js";
const router = express.Router();

router.get("/fetch-orders", getOrders);

export default router;