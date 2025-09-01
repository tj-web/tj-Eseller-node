import express from "express";
import { 
  fetchVendorProducts,
  brand_arr,
  basicDetails,
  ProductSpecification,
  saveProductFeature,
  getProductFeatures 
} from "../controllers/manageProductController.js";
import multer from "multer";

const router = express.Router();

// Storage in memory (can switch to diskStorage if you want to save files)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
router.get('/product_list', fetchVendorProducts);
router.get('/leadId', brand_arr);

//  Handle multiple files: images[] + documents[]
router.post(
  '/adddetail',
  upload.fields([
    { name: 'image', maxCount: 5 },      // up to 5 images
    { name: 'documents', maxCount: 3},
    {name:'file',maxCount:3},    // up to 3 documents
  ]),
  basicDetails
);

router.post('/specification', ProductSpecification);
router.post('/features', saveProductFeature);
router.get('/ff', getProductFeatures);

export default router;
