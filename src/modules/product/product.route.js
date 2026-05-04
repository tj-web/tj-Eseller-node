import express from "express";
import * as productController from "./product.controller.js";
import multer from "multer";

const router = express.Router();

// --- Multer Configuration ---
const storage = multer.memoryStorage();
const upload = multer({ storage });

const productBasicUpload = upload.fields([
  { name: "image", maxCount: 5 },
  { name: "documents", maxCount: 3 },
  { name: "file", maxCount: 3 },
]);

// --- 1. PRODUCT DISCOVERY & LISTING ---
router.get("/product_list", productController.fetchVendorProducts);
router.get("/:productId/leads-count", productController.getLeadsCount);
router.get("/product_brands", productController.brand_arr);
router.get("/categories", productController.searchCategories);
router.get("/languages", productController.getLanguages);

// --- 2. PRODUCT VIEW & OWNER VERIFICATION ---
router.get("/viewproduct/:product_id", productController.viewProduct);
router.get("/editproduct/:product_id", productController.editProduct);
router.get("/checkvendorproduct", productController.checkVendorProduct);

// --- 3. PRODUCT BASIC DETAILS (CREATE / UPDATE) ---
router.post(
  "/adddetail",
  productBasicUpload,
  productController.basicDetails
);
router.post(
  "/adddetail/:product_id",
  productBasicUpload,
  productController.basicDetails
);

router.post(
  "/editbasicdetails/:product_id",
  productBasicUpload,
  productController.editBasicDetails
);

// --- 4. PRODUCT SECTION-WISE MANAGEMENT ---

// Specifications
router.get("/specifications", productController.getProductSpecification);
router.post("/savespecifications", productController.ProductSpecification);

// Features
router.get("/features", productController.getAllFeaturesList);
router.get("/productfeatures", productController.getProductFeaturesList);
router.post("/savefeatures", productController.saveProductFeature);

// Media (Screenshots, Gallery, Videos, Enrichment)
router.get("/screenshots", productController.getProductScreenshots);
router.post(
  "/addscreenshots",
  upload.array("screenshot", 10),
  productController.addScreenshots
);
// Gallery
router.get("/gallery", productController.getGalleryImages);
router.post(
  "/addgallery",
  upload.any(),
  productController.addGallery
);
router.get("/videos", productController.getProductVideos);
router.post("/addvideos", productController.addVideo);
router.get("/enrichment", productController.getEnrichment);
router.post(
  "/enrichment",
  upload.any(),
  productController.enrichment
);

export default router;
