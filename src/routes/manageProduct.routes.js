import express from "express";
import { fetchVendorProducts ,brand_arr,basicDetails,ProductSpecification,saveProductFeature,getProductFeatures } from "../controllers/manageProductController.js";
import multer from "multer";
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/product_list',fetchVendorProducts)
router.get('/leadId',brand_arr)
// router.post('/adddetail',validateProduct,basicDetails)
router.post('/adddetail',upload.single('file'), basicDetails)
router.post('/specification',ProductSpecification)
router.post('/features',saveProductFeature)
router.get('/ff',getProductFeatures)


export default router;