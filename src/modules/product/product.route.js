import express from "express";
import * as productController from "./product.controller.js";
import multer from "multer";

const router = express.Router();

// --- Multer Configuration ---
const storage = multer.memoryStorage();

const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE
  ? parseInt(process.env.MAX_FILE_SIZE, 10)
  : 5 * 1024 * 1024; // 5 MB default per-file

const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_DOC_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "image" || file.fieldname === "gallery" || file.fieldname === "screenshot") {
    if (ALLOWED_IMAGE_MIMES.includes(file.mimetype)) return cb(null, true);
    return cb(new Error(`Only image files are allowed for the ${file.fieldname} field`));
  }

  if (file.fieldname === "documents" || file.fieldname === "file") {
    if (
      ALLOWED_DOC_MIMES.includes(file.mimetype) ||
      file.mimetype.startsWith("image/")
    )
      return cb(null, true);
    return cb(new Error("Invalid document/file type"));
  }

  cb(null, false);
};

const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE }, fileFilter });

const productBasicUpload = upload.fields([
  { name: "image", maxCount: 5 },
  { name: "documents", maxCount: 3 },
  { name: "file", maxCount: 3 },
]);

// --- 1. PRODUCT DISCOVERY & LISTING ---
router.get("/status-counts", productController.getProductsCount);
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
