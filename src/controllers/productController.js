import { isVendorProduc } from "../models/manageProduct.js";
import { getProductDetail } from "../models/manageProduct.js";
import { addVideoModel } from "../models/manageProduct.js";
import { insertProductScreenshots } from "../models/manageProduct.js";
import { addGalleryModel } from "../models/manageProduct.js";
import {
  getProductList,
  getVendorBrands,
} from "../models/manageProduct.js";
import {
  getSelectedColumns,
  saveProduct,
} from "../models/manageProduct.js";
import { saveOrUpdateProductSpecification } from "../models/manageProduct.js";
import { getSelectedCol } from "../models/manageProduct.js";
import { saveOrUpdateProductFeature } from "../models/manageProduct.js";
import {
  isVendorProduct,
  getAllFeatures,
} from "../models/manageProduct.js";
import { geteditProductDetail } from "../models/manageProduct.js";
import { upsertEnrichmentImages } from "../models/manageProduct.js";
import { uploadfile2 } from "../utilis/s3Uploader.js";

import sizeOf from "image-size";

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

export const basicDetails = async (req, res) => {
  try {
    const post = req.body;
    const vendorId = req.user?.vendor_id || 0;
    const product_id = req.params.product_id || null;

    let imageurl = "";

    if (req.files?.file) {
      const file = req.files.file[0]; // array of files

      let originalName = file.originalname.replace(/\s+/g, "-");
      const ext = originalName.split(".").pop().toLowerCase();
      const key = `web/assets/images/techjockey/products/${Date.now()}-${originalName}`;

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
        key,
      };

      imageurl = await uploadfile2(sanitizedFile);
    }

    // handle second image field
    let secondImageUrl = "";
    if (req.files?.image) {
      const img = req.files.image[0];

      let originalName = img.originalname.replace(/\s+/g, "-");
      const key = `web/assets/images/techjockey/products/${Date.now()}-${originalName}`;
      const sanitizedImg = {
        ...img,
        originalname: originalName,
        key,
      };

      secondImageUrl = await uploadfile2(sanitizedImg);
    }

    const save = {
      product_name: post?.product_name ?? "",
      brand_id: post?.brand_id ?? "",
      website_url: post?.website_url ?? "",
      trial_available: post?.trial_available ?? 0,
      free_downld_available: post?.free_downld_available ?? "",
      status: 0,
      date_added: new Date(),
      added_by: "vendor",
      added_by_id: vendorId ?? "",
      product_code: post?.product_code ?? "TP01",
      similar_product: post?.similar_product ?? "",
      price: post?.price || 10.2,
      special_price: post?.special_price || 200,
      duration: post?.duration || 0,
      duration_mode: post?.duration_mode ?? "",
      discount: post?.discount || 10.2,
      price_text: post?.price_text || "varun",
      brochure: post?.brochure ?? "",
      slug: post?.slug ?? "",
      search_keyword: post?.search_keyword ?? "",
      page_title: post?.page_title ?? "",
      meta_title: post?.meta_title ?? "",
      page_keyword: post?.page_keyword ?? "",
      page_description: post?.page_description ?? "",
      cano_url: post?.cano_url ?? "",
      featured_start_date: post?.featured_start_date ?? "",
      featured_end_date: post?.featured_end_date ?? "",
      downld_file_path: post?.downld_file_path ?? "",
      trial_duration: post?.trial_duration ?? "0",
      trial_duration_in: post?.trial_duration_in ?? "",
      free_downld_path: post?.free_downld_path || 0,
      show_in_peripherals: post?.show_in_peripherals ?? "0",
      price_type: post?.price_type ?? "1",
      commission_type: post?.commission_type ?? "1",
      commission: post?.commission ?? "4",
      tp_comment: post?.tp_comment ?? "",
      discount_factor: post?.discount_factor ?? "0",
      discount_value: post?.discount_value ?? "2",
      rebate: post?.rebate ?? "",
      renewable_term: post?.renewable_term ?? "",
      custom_search_order: post?.custom_search_order ?? "0",
      recommended: post?.recommended ?? "22",
      manual_reviews: post?.manual_reviews ?? "1",
    };

    const maxSlug = await getSelectedColumns(
      "tbl_website_settings",
      ["setting_value"],
      { var_name: "MAX_SLUG_ID" }
    );

    // Increment slug_id
    save.slug_id = parseInt(maxSlug?.setting_value || 0) + 1;

    // Insert product
    const productId = await saveProduct(save, imageurl, product_id);

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

    if (!deployment || !device || !operating_system || !organization_type) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    // Convert arrays → CSV
    // const toCSV = (val) => (Array.isArray(val) ? val.join(",") : val);
    const productData = {
      product_id,
      deployment,
      device,
      operating_system,
      organization_type,
      languages,
    };

    const data = await getSelectedCol({
      table: "tbl_product_specification", //  real table name
      columns: ["id"], // select only id
      where: { product_id: product_id }, // condition
      records: "single",
    });
    const id = data?.id || null;
    const result = await saveOrUpdateProductSpecification(id, productData);

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

export const saveProductFeature = async (req, res) => {
  try {
    const post = req.query;
    // console.log("Received product feature data:", post);return;

    if (!post.product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }
    const data = await getSelectedCol({
      table: "tbl_product_features", //  real table name
      columns: ["id"], // select only id
      where: { product_id: post.product_id }, // condition
      records: "single",
    });
    const id = data?.id || null;

    // Call model to handle DB operation
    const result = await saveOrUpdateProductFeature(id, post);

    if (result.action === "update") {
      return res.status(200).json({
        message: "Feature updated",
        id: result.id,
        product_id: post.product_id,
      });
    } else {
      return res.status(201).json({
        message: "success",
        response:
          "We have recorded your changes! We will review and update soon.",
        id: result.id,
        result,
        product_id: post.product_id,
      });
    }
  } catch (error) {
    console.error("Error saving product feature (controller):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//-------------function for getting the list of the features added --------------------

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

export const addScreenshots = async (req, res) => {
  try {
    const { product_id } = req.body;
    const files = req.files; // depends on multer config
let alt_text = req.body.alt_text; // can be string or array 

    if (!product_id || !files || files.length === 0) {
      return res
        .status(400)
        .json({ error: "Product ID and screenshots are required" });
    }

    const existingRows = await getSelectedCol({
      table: "tbl_product_screenshots",
      columns: ["id"],
      where: { product_id: product_id },
      records: "all", // fetch ALL instead of single
    });

  
    // Ensure alt_text is always an array
    let altArray = [];
    if (Array.isArray(alt_text)) {
      altArray = alt_text;
    } else if (alt_text) {
      altArray = [alt_text];
    }

    const screenshotsData = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const originalName = file.originalname.replace(/\s+/g, "-");
      const key = `web/assets/images/techjockey/products/screenshots/${Date.now()}-${originalName}`;

      // Upload to S3
      const s3Url = await uploadfile2({ ...file, key });

      screenshotsData.push({
        product_id,
        image: s3Url, // S3 URL
        alt_text: altArray[i] || null,
        id: existingRows[i]?.id || null, // attach id if exists
      });
    }
    const result = await insertProductScreenshots(screenshotsData);

    let message = "No changes applied";
    if (result.inserted > 0 && result.updated > 0) {
      message = "Screenshots added and updated successfully";
    } else if (result.inserted > 0) {
      message = "Screenshots added successfully";
    } else if (result.updated > 0) {
      message = "Screenshots updated successfully";
    }

    res.status(200).json({
      success: true,
      message,
      data: screenshotsData,
    });
  } catch (error) {
    console.error("Error adding screenshots:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


//-----------------------------Add gallery-----------------------------------------

export const addGallery = async (req, res) => {
  try {
    const { title, description, product_id } = req.body;
    const files = req.files;
    // console.log("Files received for gallery:", files);return;

    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one image is required" });
    }

    // Get existing gallery ids for this product
    const existingRows = await getSelectedCol({
      table: "tbl_description_gallery",
      columns: ["id"],
      where: { product_id: product_id },
      records: "all", // fetch ALL instead of single
    });

    const titleArr = Array.isArray(title) ? title : [title];
    const descriptionArr = Array.isArray(description)
      ? description
      : [description];

    const uploadedFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const originalName = file.originalname.replace(/\s+/g, "-");
      const key = `web/assets/images/techjockey/gallery/${Date.now()}-${originalName}`;

      const awsUrl = await uploadfile2({ ...file, key });

      uploadedFiles.push({
        id: existingRows[i]?.id || null, // attach id if exists
        image: awsUrl,
        title: titleArr[i] || titleArr[0],
        description: descriptionArr[i] || descriptionArr[0],
      });
    }

    const result = await addGalleryModel(uploadedFiles, product_id);

    return res.status(201).json({
      message: "Gallery added/updated successfully",
      gallery: result,
    });
  } catch (error) {
    console.error("Error adding gallery:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//------------------------------Add Video-----------------------------------------

export const addVideo = async (req, res) => {
  try {
    // console.log("Request body for videos:", req.body);return;
    const { product_id, data } = req.body;

    if (!product_id || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        message: "Product ID and at least one video are required",
      });
    }

    // Fetch all existing IDs for this product
    const existingRows = await getSelectedCol({
      table: "tbl_product_videos",
      columns: ["id"],
      where: { product_id },
      records: "all",
    });

    // Map videos with existing IDs if updating
    const videosToProcess = data.map((v, i) => ({
      id: existingRows[i]?.id || null,
      product_id,
      video_title: v.video_title || "",
      video_url: v.video_url || "",
      video_desc: v.video_desc || "",
    }));

    // Save videos in DB
    const result = await addVideoModel(videosToProcess);

    return res.status(201).json({
      message: "Videos added/updated successfully",
      result,
    });

  } catch (error) {
    console.error("Error adding videos:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//------------------------View Product controller------------------------
export const viewProduct = async (req, res) => {
  try {
    const { product_id } = req.params;

    if (!product_id) {
      return res.redirect("/product-list");
    }

    const productData = await getProductDetail(product_id);

    return res.json({
      active_tab: "view_product",
      product_data: productData,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//------------------------Edit Product controller------------------------

export const checkVendorProduct = async (req, res) => {
  try {
    const { product_id, vendor_id } = req.body;

    const brandArr = await getVendorBrands(vendor_id);
    const isVendor = await isVendorProduc(product_id, brandArr);

    return res.json({
      success: true,
      isVendorProduct: isVendor,
    });
  } catch (err) {
    console.error("Error in checkVendorProduct:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//----------------This is controller will help to get data of the existing product and show in the form for editing------------------------

export const editProduct = async (req, res) => {
  try {
    const productId = req.params.product_id;
    const replacements = { productId: productId }; // plain object

    const productData = await geteditProductDetail(replacements.productId);

    if (!productData) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      success: true,
      product: productData,
    });
  } catch (error) {
    console.error("Error fetching product for edit:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//----------this for the enrichment part of the form-----------------

export const enrichment = async (req, res) => {
  try {
    const { product_id, type } = req.body;
    const files = req.files || [];
    //  console.log("Files received:", files);return;
    let typeArr = [];

    // Make sure typeArr matches files length
    if (Array.isArray(type)) {
      typeArr = type.map(Number);
    } else if (type) {
      // Single type sent
      typeArr = Array(files.length).fill(Number(type));
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Type is required for each image" });
    }

    // Now validate counts per type
    const typeCount = typeArr.reduce((acc, t) => {
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});

    // Dynamic validation
    for (const t in typeCount) {
      if (typeCount[t] < 4) {
        return res.status(400).json({
          success: false,
          message: `Please upload at least 4 images for type ${
            Number(t) === 1 ? "desktop" : "mobile"
          }`,
        });
      }
    }

    // Fetch existing enrichment images for this product
    const existingRows = await getSelectedCol({
      table: "tbl_product_enrichment_images",
      columns: ["id", "type"],
      where: { product_id, is_deleted: 0 },
      records: "multiple",
    });

    // Prepare enrichment data with update/insert logic
    const enrichmentData = files.map((file, index) => {
      const dimensions = sizeOf(file.buffer);

      // Match existing row by type (first match)
      const existingIndex = existingRows.findIndex(
        (row) => row.type === typeArr[index]
      );
      const existing =
        existingIndex !== -1 ? existingRows.splice(existingIndex, 1)[0] : null;

      return {
        id: existing?.id || null, // update if exists
        product_id,
        type: typeArr[index],
        image_width: dimensions.width,
        image_height: dimensions.height,
        image: file.originalname,
      };
    });

    const saved = await upsertEnrichmentImages(enrichmentData);

    return res.json({
      success: true,
      message: "Enrichment images processed successfully",
      saved, // only newly inserted/updated images
    });
  } catch (error) {
    console.error("Error in enrichmentController:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
