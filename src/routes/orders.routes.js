import express from "express";
import { getOrders } from "../controllers/orders.controller.js";
const router = express.Router();
 
router.get("/order",getOrders);
 
export default router;