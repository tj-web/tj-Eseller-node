import express from "express";
import { fetchVendorProducts ,brand_arr,basicDetails } from "../controllers/manageProductController.js";
// import {validateProduct} from '../middlewares/formvalidator.js'
const router = express.Router();


router.get('/product_list',fetchVendorProducts)
router.get('/leadId',brand_arr)
// router.post('/adddetail',validateProduct,basicDetails)
router.post('/adddetail',basicDetails)

export default router;