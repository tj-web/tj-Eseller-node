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
const upload = multer({ storage: storage });
router.get("/", getBrands);
router.post("/checkbrand", checkBrand);
router.post("/addbrand", upload.single("image"), addBrand);
router.post(
  "/addbrand/:brand_id",
  upload.single("image"), 
  updateBrandController
);
router.get("/viewbrand/:brand_id", view_brand);
router.get("/:pagenumber", getBrands);

export default router;
