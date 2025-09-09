import express from "express";
import {
  fetchVendorProducts,
  brand_arr,
  basicDetails,
  ProductSpecification,
  saveProductFeature,
  getProductFeatures,
  addScreenshots,
  addGallery,
  addVideo,
  viewProduct,
  checkVendorProduct,
  editProduct,
  enrichment,
} from "../controllers/manageProductController.js";
import multer from "multer";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
router.get("/product_list", fetchVendorProducts);
router.get("/leadId", brand_arr);
router.get("/vv/:product_id", viewProduct);

router.post(
  "/adddetail",
  upload.fields([
    { name: "image", maxCount: 5 },
    { name: "documents", maxCount: 3 },
    { name: "file", maxCount: 3 },
  ]),
  basicDetails
);
router.post(
  "/adddetail/:product_id",
  upload.fields([
    { name: "image", maxCount: 5 },
    { name: "documents", maxCount: 3 },
    { name: "file", maxCount: 3 },
  ]),
  basicDetails
);

router.post("/specification", ProductSpecification);
router.post("/features", saveProductFeature);
router.get("/getfeatures", getProductFeatures);
router.post("/addscreenshots", upload.array("screenshot", 5), addScreenshots);
router.post("/addgallery", upload.array("image", 5), addGallery);
router.post("/addvideos",  addVideo);
router.get("/ff", checkVendorProduct);
router.get("/editproduct/:product_id", editProduct);
router.post("/enrichment", upload.array("images", 10), enrichment);

export default router;
