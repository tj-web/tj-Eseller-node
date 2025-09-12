import express from "express";
const router = express.Router();

import {
  manageLeads,
  getLeadHistoryPost,
  addRemarkReminder,
getDemosCountController
} from "../controllers/leadsController.js";
router.get("/leads", manageLeads);
router.post("/leadsHistory", getLeadHistoryPost);
router.post('/addRemark',addRemarkReminder);
router.get('/my_demos',getDemosCountController)

export default router;
