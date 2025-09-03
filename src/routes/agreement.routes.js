import {agreementFormController, getAgreements} from "../controllers/agreementController.js";
import express from 'express';
const router = express.Router();

router.get('/', getAgreements);
router.post('/', agreementFormController);

export default router;