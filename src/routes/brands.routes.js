import express from "express";
import { getBrands } from "../controllers/brands.controller.js";
const router = express.Router();
 
router.get("/",getBrands);
router.get("/:pagenumber", getBrands);
 
export default router;