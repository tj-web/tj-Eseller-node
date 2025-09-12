import express from "express";
import { getAccountHealth,getReviews } from "../controllers/healthController.js";

const router = express.Router();

router.get("/trusted_seller", getAccountHealth);
router.get("/reviews", getReviews);


export default router;