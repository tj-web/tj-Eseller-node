import {
  getProductList,
  getVendorBrands,
} from "../models/ManageProduct/getManageProduct.js";

// import { getSelectedColumns , saveProduct} from "../models/ManageProduct/addBasicDetails.js";

export const brand_arr = async (req, res) => {
  try {
    const { vendor_id } = req.query;

    if (!vendor_id) {
      return res
        .status(400)
        .json({ status: false, message: "vendor_id is required" });
    }

    const brand = await getVendorBrands(vendor_id);

    return res.status(200).json({
      status: true,
      message: "Brands fetched successfully",
      data: brand,
    });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const fetchVendorProducts = async (req, res) => {
  try {
    const vendor_id = req.user?.vendor_id || req.query.vendor_id;
    if (!vendor_id) {
      return res
        .status(400)
        .json({ status: false, message: "vendor_id is required" });
    }

    const search_filter = {
      srch_product_name: req.query.srch_product_name || "",
      srch_status: req.query.srch_status || "",
    };

    const order_by = req.query.order_by || "s_id";
    const order = req.query.order || "desc";
    const limit = req.query.limit;
    const pageNumber = req.query.pageNumber;

    const brand_arr = await getVendorBrands(vendor_id);

    const products = await getProductList(
      brand_arr,
      search_filter,
      order_by,
      order,
      limit,
      pageNumber
    );

    return res.json({
      status: true,
      message: "Products fetched successfully",
      products,
    });
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// ----------------------------------Add Basic details of the form ------------------------

import { getSelectedColumns , saveProduct} from "../models/ManageProduct/addBasicDetails.js";

export const basicDetails = async (req, res) => {
  try {
    const post = req.query;
    const vendorId = req.user?.vendor_id || 0; // assuming vendor_id comes from auth middleware

    // Prepare save object
    const save = {
      product_name: post.product_name,
      brand_id: post.brand_id,
      website_url: post.website_url,
      trial_available: post.trial_available,
      free_downld_available: post.free_downld_available,
      status: 0,
      date_added: new Date(), // MySQL DATETIME auto handled
      added_by: "vendor",
      added_by_id: vendorId,
      product_code: post.product_code,
      similar_product:post.similar_product,
      price:post.price,
      special_price:post.special_price,
      duration:post.duration,
      duration_mode:post.duration_mode,
      discount:post.discount,
      price_text:post.price_text,
      brochure:post.brochure,
      slug:post.slug,
      search_keyword:post.search_keyword,
      page_title:post.page_title,
      meta_title:post.meta_title,
      page_keyword:post.page_keyword,
      page_description:post.page_description,
      cano_url:post.cano_url,
      featured_start_date:post.featured_start_date,
      featured_end_date:post.featured_end_date,
      downld_file_path:post.downld_file_path,
      trial_duration:post.trial_duration,
      trial_duration_in:post.trial_duration_in,
      free_downld_path:post.free_downld_path,
      show_in_peripherals:post.show_in_peripherals,
      price_type:post.price_type,
      commission_type:post.commission_type,
      commission:post.commission,
      tp_comment:post.tp_comment,
      discount_factor:post.discount_factor,
      discount_value:post.discount_value,
      rebate:post.rebate,
      renewable_term:post.renewable_term,
      custom_search_order:post.custom_search_order,
      recommended:post.recommended,
      manual_reviews:post.manual_reviews,
      
    };

    // Fetch MAX_SLUG_ID
    const maxSlug = await getSelectedColumns(
      "tbl_website_settings",
      ["setting_value"],
      { var_name: "MAX_SLUG_ID" }
    );

    // Increment slug_id
    save.slug_id = parseInt(maxSlug?.setting_value || 0) + 1;

    // Insert product
    const productId = await saveProduct(save);

    res.status(201).json({
      success: true,
      message: "Product saved successfully",
      product_id: productId,
    });
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// ------------Product Specification -------------------------------------------
import { saveOrUpdateProductSpecification } from "../models/ManageProduct/productSpecification.js";

export const ProductSpecification = async (req, res) => {
  try {
    const { id, deployment, device, operating_system, organization_type, languages } = req.query;

    // ✅ Basic validation
    if (!deployment || !device || !operating_system || !organization_type) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    // ✅ Format arrays into CSV
    const productData = {
      deployment: Array.isArray(deployment) ? deployment.join(",") : deployment,
      device: Array.isArray(device) ? device.join(",") : device,
      operating_system: Array.isArray(operating_system) ? operating_system.join(",") : operating_system,
      organization_type: Array.isArray(organization_type) ? organization_type.join(",") : organization_type,
      languages: Array.isArray(languages) ? languages.join(",") : languages,
    };

    // ✅ Call model function
    const result = await saveOrUpdateProductSpecification(id, productData);

    return res.status(200).json({
      message: "Changes have been recorded successfully!",
      data: result,
    });

  } catch (error) {
    console.error("Error updating product specification:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


