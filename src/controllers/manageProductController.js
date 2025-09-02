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

import {
  getSelectedColumns,
  saveProduct,
} from "../models/ManageProduct/addBasicDetails.js";
import { uploadfile2 } from "../utilis/s3Uploader.js";

export const basicDetails = async (req, res) => {
  try {
    const post = req.body;
    const vendorId = req.user?.vendor_id || 0;

    let imageurl = "";

if (req.files?.file) {
  const file = req.files.file[0]; // array of files
  console.log("File received:", file);

  let originalName = file.originalname.replace(/\s+/g, "-");
  const ext = originalName.split(".").pop().toLowerCase();

  const allowedTypes = ["png", "jpg", "jpeg", "gif"];
  if (!allowedTypes.includes(ext)) {
    return res.status(400).json({
      success: false,
      message: "Invalid file type. Allowed types: png, jpg, jpeg, gif",
    });
  }

  const sanitizedFile = {
    ...file,
    originalname: originalName,
  };

  imageurl = await uploadfile2(sanitizedFile);
}

// handle second image field
let secondImageUrl = "";
if (req.files?.image) {
  const img = req.files.image[0];
  console.log("Second image received:", img);

  let originalName = img.originalname.replace(/\s+/g, "-");
  const sanitizedImg = {
    ...img,
    originalname: originalName,
  };

  secondImageUrl = await uploadfile2(sanitizedImg);
}



    const save = {
  product_name: post?.product_name ?? '',
  brand_id: post?.brand_id ?? '',
  website_url: post?.website_url ?? '',
  trial_available: post?.trial_available ?? '',
  free_downld_available: post?.free_downld_available ?? '',
  status: 0,
  date_added: new Date(),
  added_by: "vendor",
  added_by_id: vendorId ?? '',
  product_code: post?.product_code ?? '',
  similar_product: post?.similar_product ?? '',
  price: post?.price ?? '',
  special_price: post?.special_price ?? '',
  duration: post?.duration ?? '',
  duration_mode: post?.duration_mode ?? '',
  discount: post?.discount ?? '',
  price_text: post?.price_text ?? '',
  brochure: post?.brochure ?? '',
  slug: post?.slug ?? '',
  search_keyword: post?.search_keyword ?? '',
  page_title: post?.page_title ?? '',
  meta_title: post?.meta_title ?? '',
  page_keyword: post?.page_keyword ?? '',
  page_description: post?.page_description ?? '',
  cano_url: post?.cano_url ?? '',
  featured_start_date: post?.featured_start_date ?? '',
  featured_end_date: post?.featured_end_date ?? '',
  downld_file_path: post?.downld_file_path ?? '',
  trial_duration: post?.trial_duration ?? '0',
  trial_duration_in: post?.trial_duration_in ?? '',
  free_downld_path: post?.free_downld_path ?? '',
  show_in_peripherals: post?.show_in_peripherals ?? '0',
  price_type: post?.price_type ?? '1',
  commission_type: post?.commission_type ?? '1',
  commission: post?.commission ?? '4',
  tp_comment: post?.tp_comment ?? '',
  discount_factor: post?.discount_factor ?? '0',
  discount_value: post?.discount_value ?? '2',
  rebate: post?.rebate ?? '',
  renewable_term: post?.renewable_term ?? '',
  custom_search_order: post?.custom_search_order ?? '0',
  recommended: post?.recommended ?? '22',
  manual_reviews: post?.manual_reviews ?? '1',
};


    const maxSlug = await getSelectedColumns(
      "tbl_website_settings",
      ["setting_value"],
      { var_name: "MAX_SLUG_ID" }
    );

    // Increment slug_id
    save.slug_id = parseInt(maxSlug?.setting_value || 0) + 1;

    // Insert product
    const productId = await saveProduct(save,imageurl);

    res.status(201).json({
      success: true,
      message: "Product saved successfully",
      product_id: productId,
       fileUrl: imageurl || null,
       imageUrl: secondImageUrl || null,
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
    const {
      product_id,
      deployment,
      device,
      operating_system,
      organization_type,
      languages,
    } = req.query;

    // Validation
    if (!deployment || !device || !operating_system || !organization_type) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    // Convert arrays → CSV
    const toCSV = (val) => (Array.isArray(val) ? val.join(",") : val);
    const productData = {
      product_id,
      deployment: toCSV(deployment),
      device: toCSV(device),
      operating_system: toCSV(operating_system),
      organization_type: toCSV(organization_type),
      languages: toCSV(languages),
    };

    const result = await saveOrUpdateProductSpecification("", productData);

    return res.status(200).json({
      message: "Changes have been recorded successfully!",
      data: result,
    });
  } catch (error) {
    console.error("Error updating product specification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//--------------------------------------------features part of the form--------------

import { saveOrUpdateProductFeature } from "../models/ManageProduct/getFeatures.js";

export const saveProductFeature = async (req, res) => {
  try {
    const post = req.query; // or req.body if using JSON

    // Validate required field
    if (!post.product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }

    // Call model to handle DB operation
    const result = await saveOrUpdateProductFeature(post);

    if (result.action === "update") {
      return res
        .status(200)
        .json({ message: "Feature updated", id: result.id });
    } else {
      return res
        .status(201)
        .json({ message: "Feature inserted", id: result.id });
    }
  } catch (error) {
    console.error("Error saving product feature (controller):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//-------------function for getting the list of the features added --------------------
import {
  isVendorProduct,
  getAllFeatures,
} from "../models/ManageProduct/featuresAddlist.js";

export const getProductFeatures = async (req, res) => {
  try {
    const { product_id, vendor_id } = req.query;

    if (product_id) {
      // Get brand array
      const brand = await getVendorBrands(vendor_id);
      brand.push(9868);

      // Check if vendor owns this product
      const check = await isVendorProduct(product_id, brand);

      if (check) {
        // Fetch all features
        const allFeatures = await getAllFeatures(product_id);

        return res.status(200).json({
          success: true,
          allFeatures,
        });
      } else {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: Product does not belong to vendor",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }
  } catch (error) {
    console.error("Error getting product features:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

//----------------------------Add screenshots----------------------------
import { insertProductScreenshots } from "../models/ManageProduct/AddScreenshot.js";
import { send } from "node-dev/lib/ipc.js";

export const addScreenshots = async (req, res) => {
  try {
    const { product_id } = req.body;
    const image = req.files; 
    const img_alt = req.body.alt_text; 
    // console.log("Received files:", image);

    if (!product_id || !image || image.length === 0) {
      return res.status(400).json({ error: "Product ID and screenshots are required" });
    }

    // Normalize alt_text
    let altArray = [];
    if (Array.isArray(img_alt)) {
      altArray = img_alt;
    } else if (img_alt) {
      altArray = [img_alt];
    }
    const screenshotsData = image.map((file, index) => ({
      product_id,
      image: file.originalname,
      alt_text: altArray[index] || null   
    }));

    await insertProductScreenshots(screenshotsData);

    res.status(200).json({
      success: true,
      message: "Screenshots added successfully",
      data: screenshotsData
    });

  } catch (error) {
    console.error("Error adding screenshots:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//-----------------------------Add gallery-----------------------------------------

import { addGalleryModel } from "../models/ManageProduct/addGallery.js";

export const addGallery = async (req, res) => {
  try {
    const { title, description, product_id } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }
    const titleArr = Array.isArray(title) ? title : [title];
    const descriptionArr = Array.isArray(description) ? description : [description];

    const result = await addGalleryModel(files, titleArr, descriptionArr, product_id);

    return res.status(201).json({
      message: "Gallery added successfully",
      result,
    });
  } catch (error) {
    console.error("Error adding gallery:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


//------------------------------Add Video-----------------------------------------
import { addVideoModel } from "../models/ManageProduct/addVideos.js";

export const addVideo = async (req, res) => {
  try {
    const { video_title, video_url, video_desc, product_id } = req.body;

    if (!video_url || (Array.isArray(video_url) && video_url.length === 0)) {
      return res.status(400).json({ message: "At least one video is required" });
    }

    // Ensure arrays
    const titleArr = Array.isArray(video_title) ? video_title : [video_title];
    const urlArr = Array.isArray(video_url) ? video_url : [video_url];
    const descriptionArr = Array.isArray(video_desc) ? video_desc : [video_desc];

    const result = await addVideoModel(urlArr, titleArr, urlArr, descriptionArr, product_id);

    return res.status(201).json({
      message: "Videos added successfully",
      result,
    });
  } catch (error) {
    console.error("Error adding videos:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


