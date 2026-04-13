import express from "express";
import { getOrders } from "./orders.controller.js";
const router = express.Router();
 
router.get("/",getOrders);
 
export default router;