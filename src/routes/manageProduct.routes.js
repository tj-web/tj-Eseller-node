import express from "express";
import { fetchVendorProducts } from "../controllers/manageProductController.js";
const router = express.Router();


router.get('/product_list',fetchVendorProducts)

export default router;