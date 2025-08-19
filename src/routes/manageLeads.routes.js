import express from "express";
const router = express.Router();

import {
  manageLeads,
  getLeadHistoryPost,
  addRemarkReminder
} from "../controllers/manageLeadsController.js";
router.get("/leads", manageLeads);
router.post("/leadsHistory", getLeadHistoryPost);
router.post('/addRemark',addRemarkReminder);

export default router;
