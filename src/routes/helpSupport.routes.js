import express from "express";
import { addHelpSupportQuery } from "../controllers/helpSupportController.js";
import { validateHelpSupportQuery } from "../validators/helpSupportValidators/helpSupportValidation.js";
const router = express.Router();

router.post('/add', validateHelpSupportQuery, addHelpSupportQuery);




export default router;