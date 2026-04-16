import express from "express";
import { addHelpSupportQuery } from "./helpSupport.controller.js";
const router = express.Router();

router.post('/add', addHelpSupportQuery);

export default router;