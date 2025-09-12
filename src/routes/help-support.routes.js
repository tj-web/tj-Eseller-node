import express from "express";
import { addHelpSupportQuery } from "../controllers/helpController.js";
const router = express.Router();

router.post('/add', addHelpSupportQuery);




export default router;