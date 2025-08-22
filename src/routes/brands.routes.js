import express from "express";
import { addBrand, checkBrand,getBrands } from "../controllers/brands.controller.js";
const router = express.Router();
 
router.get("/",getBrands);
router.post("/checkbrand", checkBrand);
router.post("/addbrand", addBrand);
router.get("/:pagenumber", getBrands);
 
export default router;