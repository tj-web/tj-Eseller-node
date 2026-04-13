import express from "express";
import {
  fetchVendorProducts,
  brand_arr,
  basicDetails,
  searchCategories,
  getLanguages,
  ProductSpecification,
  getProductSpecification,
  saveProductFeature,
  getProductFeaturesList,
  getAllFeaturesList,
  addScreenshots,
  addGallery,
  addVideo,
  viewProduct,
  checkVendorProduct,
  editProduct,
  enrichment,
} from "./product.controller.js";
import multer from "multer";
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
router.get("/product_list", fetchVendorProducts);
router.get("/leadId", brand_arr);
router.get("/viewproduct/:product_id", viewProduct);
router.get("/categories", searchCategories);

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

router.get("/specifications", getProductSpecification);
router.get("/languages", getLanguages);
router.post("/savespecifications", ProductSpecification);
router.post("/savefeatures", saveProductFeature);
router.get("/productfeatures", getProductFeaturesList);
router.get("/features", getAllFeaturesList);
router.post("/addscreenshots", upload.array("screenshot", 5), addScreenshots);
router.post("/addgallery", upload.array("image", 5), addGallery);
router.post("/addvideos", addVideo);
router.get("/checkvendorproduct", checkVendorProduct);
router.get("/editproduct/:product_id", editProduct);
router.post("/enrichment", upload.array("images", 10), enrichment);

export default router;
