import express from "express";
import { addBrand, checkBrand,getBrands, view_brand } from "../controllers/brands.controller.js";
const router = express.Router();
 
router.get("/",getBrands);
router.post("/checkbrand", checkBrand);
router.post("/addbrand", addBrand);
router.get("/viewbrand/:brand_id",view_brand );
// router.post("/addbrand/:brand_id",);
router.get("/:pagenumber", getBrands);
 
export default router; 