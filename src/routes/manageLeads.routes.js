import express from "express";
const router = express.Router();
import { manageLeads } from "../controllers/manageLeadsController";
router.get("/leads", manageLeads);

export default router;