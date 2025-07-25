import express from "express";
import { totalLeadsCountInfo } from "../controllers/dashboardController.js";
import {validateOemTotalLeadsQuery} from '../middlewares/dashboardValidator.js'
const router = express.Router();

router.get("/leadsCount", validateOemTotalLeadsQuery,totalLeadsCountInfo);

export default router;
