import express from "express";
import { fetchVendorProducts ,brand_arr,basicDetails,ProductSpecification,saveProductFeature,getProductFeatures } from "../controllers/manageProductController.js";
const router = express.Router();


router.get('/product_list',fetchVendorProducts)
router.get('/leadId',brand_arr)
// router.post('/adddetail',validateProduct,basicDetails)
router.post('/adddetail',basicDetails)
router.post('/specification',ProductSpecification)
router.post('/features',saveProductFeature)
router.get('/ff',getProductFeatures)


export default router;