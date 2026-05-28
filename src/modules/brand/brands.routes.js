import express from "express";
import {
  addBrand,
  getBrandsCount,
  getBrands,
  updateBrand,
  viewBrand,
  requestBrand,
  searchBrandsForRequest,
} from "./brand.controller.js";
import multer from "multer";
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

/******  Get route for brand-list loading******/
router.get("/brand-list", getBrands);

/****** Route for brand counts by status (tab badges) *****/
router.get("/counts", getBrandsCount);

/****** Route for adding a new brand *********/
router.post("/add-brand", upload.single("image"), addBrand);

/****** Route for updating the brand information. *****/
router.post("/add-brand/:brand_id", upload.single("image"), updateBrand);

/***** Route for viewing the brand information. ******/
router.get("/view-brand/:brand_id", viewBrand);

/****** Route for Searching Global Brands to request a Brand *****/
router.get("/search-brands", searchBrandsForRequest);

/***** Dynamic route for viewing brands based on page number (pagination). ******/
router.get("/:pagenumber", getBrands);

/****** Route for Requesting a brand *********/
router.post("/request-brand", requestBrand);

export default router;
