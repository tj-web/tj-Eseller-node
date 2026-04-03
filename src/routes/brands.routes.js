import express from "express";
import {
  addBrand,
  checkBrand,
  getBrandsCount,
  getBrands,
  updateBrand,
  view_brand,
} from "../controllers/brands.controller.js";
import multer from "multer";
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

/******  Get route for brand-list loading******/
router.get("/brand-list", getBrands);

/****** Route for brand counts by status (tab badges) *****/
router.get("/counts", getBrandsCount);

/****** Route for checking brand name availability *****/
router.post("/checkbrand", checkBrand);

/****** Route for adding a new brand *********/
router.post("/addbrand", upload.single("image"), addBrand);

/****** Route for updating the brand information. *****/
router.post("/addbrand/:brand_id", upload.single("image"), updateBrand);

/***** Route for viewing the brand information. ******/
router.get("/viewbrand/:brand_id", view_brand);

/***** Dynamic route for viewing brands based on page number (pagination). ******/
router.get("/:pagenumber", getBrands);

export default router;
