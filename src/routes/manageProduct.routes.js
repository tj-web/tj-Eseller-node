import express from "express";
import { fetchVendorProducts ,brand_arr } from "../controllers/manageProductController.js";
const router = express.Router();


router.get('/product_list',fetchVendorProducts)
router.get('/leadId',brand_arr)

export default router;