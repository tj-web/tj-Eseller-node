import express from "express";
const router = express.Router();

import { company_information } from "../controllers/companyInformationController.js";

router.get("/", company_information);

export default router;