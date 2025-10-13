import express from "express";
const router = express.Router();

import {
  manageLeads,
  getLeadHistoryPost,
  addRemarkReminder,
getDemosCountController
} from "../controllers/leadsController.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
router.get("/leads",isAuthenticated, manageLeads);
router.post("/leadsHistory",isAuthenticated, getLeadHistoryPost);
router.post('/addRemark',isAuthenticated,addRemarkReminder);
router.get('/my_demos',isAuthenticated,getDemosCountController)

export default router;
