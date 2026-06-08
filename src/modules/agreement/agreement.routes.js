import { agreementForm, getAgreements } from "./agreement.controller.js";
import express from 'express';
const router = express.Router();

router.get('/', getAgreements);
router.post('/', agreementForm);

export default router;