import express from "express";
import {
  addBrand,
  checkBrand,
  getBrands,
  updateBrandController,
  view_brand,
} from "../controllers/brands.controller.js";
import multer from "multer";
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

/******  Get route for brand-list loading******/
router.get("/", getBrands);

/****** Route for checking brand name availability *****/
router.post("/checkbrand", checkBrand);

/****** Route for adding a new brand *********/
router.post("/addbrand", upload.single("image"), addBrand);

/****** Route for updating the brand information. *****/
router.post(
  "/addbrand/:brand_id",
  upload.single("image"),
  updateBrandController
);

/***** Route for viewing the brand information. ******/
router.get("/viewbrand/:brand_id", view_brand);

/***** Dynamic route for viewing brands based on page number (pagination). ******/
router.get("/:pagenumber", getBrands);

export default router;
