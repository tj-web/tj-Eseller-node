import express from "express";
const router = express.Router();

import {
  manageLeads,
  getLeadHistoryPost,
  addRemarkReminder,
getDemosCountController
} from "./manageLeadsController.js";
router.get("/manageLeads", manageLeads);
router.get("/leadsHistory/:lead_id", getLeadHistoryPost);
router.post('/addRemark',addRemarkReminder);
router.get('/my_demos',getDemosCountController)

export default router;
