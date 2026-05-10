import express from "express";
import { linkedinInitiate, linkedinCallback } from "./linkedin.controller.js";

const router = express.Router();

router.get("/initiate", linkedinInitiate);

router.get("/callback", linkedinCallback);

export default router;
