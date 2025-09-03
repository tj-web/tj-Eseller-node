import express from "express";
import { addHelpSupportQuery } from "../controllers/helpSupportController.js";
const router = express.Router();

router.post('/add', addHelpSupportQuery);




export default router;