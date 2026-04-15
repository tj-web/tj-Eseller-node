import {agreementFormController, getAgreements} from "./agreement.controller.js";
import express from 'express';
const router = express.Router();

router.get('/', getAgreements);
router.post('/', agreementFormController);

export default router;