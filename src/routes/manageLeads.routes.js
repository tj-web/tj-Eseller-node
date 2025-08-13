import express from "express";
const router = express.Router();

import {
  manageLeads,
  getLeadHistoryPost,
} from "../controllers/manageLeadsController.js";
router.get("/leads", manageLeads);
router.post("/leadsHistory", getLeadHistoryPost);

export default router;
