import * as productService from "./product.service.js";
import { uploadfile2 } from "../../utilis/s3Uploader.js";
import fs from "fs";
import path from "path";
import sizeOf from "image-size";
import StatusCodes from "../../utilis/statusCodes.js";
import SystemResponse from "../../utilis/systemResponse.js";

export const brand_arr = async (req, res) => {
  try {
    const vendor_id = req.user.vendor_id;

    if (!vendor_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("vendor_id is required"));
    }

    // Fetch full brand details for the vendor using the exact condition
    const brands = await productService.getVendorBrandsDetails(vendor_id);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Brands fetched successfully", brands));
  } catch (error) {
    console.error("Error fetching brands:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      SystemResponse.internalServerError("Internal Server Error")
    );
  }
};

export const fetchVendorProducts = async (req, res) => {
  try {
    const vendor_id = req.user.vendor_id;
    if (!vendor_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("vendor_id is required"));
    }

    const search_filter = {
      srch_product_name: req.query.srch_product_name || "",
      srch_status: req.query.srch_status || req.query.status || "",
    };

    const order_by = req.query.order_by || "s_id";
    const order = req.query.order || "desc";
    const limit = req.query.limit;
    const pageNumber = req.query.pageNumber;

    const brand_arr = await productService.getVendorBrands(vendor_id);
    // console.log("Vendor brands:", brand_arr); // Debug log

    const products = await productService.getProductList(
      brand_arr,
      search_filter,
      order_by,
      order,
      limit,
      pageNumber,
    );
    // console.log("Fetched products:", products); // Debug log

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Products fetched successfully", products));
  } catch (error) {
    console.error("Error fetching vendor products:", error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(
        SystemResponse.internalServerError(
          "Internal Server Error in vendor products",
        ),
      );
  }
};

export const getLeadsCount = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const count = await productService.getProductLeadsCount(productId);

    return res.status(200).json({
      success: true,
      product_id: productId,
      total_leads: count
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// search categories of products
export const searchCategories = async (req, res) => {
  try {
    const { search = "", limit = 20, offset = 0 } = req.query;

    const categories = await productService.getCategoryList(
      search,
      limit,
      offset,
    );
    // console.log("Fetched categories:", categories); // Debug log

    return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Categories fetched successfully", categories));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(SystemResponse.internalServerError("Internal Server Error in fetching categories"));
  }
};

// ----------------------------------Add Basic details of the form ------------------------

export const basicDetails = async (req, res) => {
  let transaction = null;
  try {
    const post = req.body;
    const vendor_id = req.user.vendor_id;
    const product_id = req.params.product_id || null;
    const isNewProduct = product_id === null;

    // === STEP 1: Build the product payload ===
    const save = {
      product_name: post?.product_name ?? "",
      brand_id: post?.brand_id ?? "",
      website_url: post?.website_url ?? "",
      trial_available: post?.trial_available ?? 0,
      free_downld_available: post?.free_downld_available ?? "",
      status: 0,
      date_added: new Date(),
      added_by: "vendor",
      added_by_id: vendor_id ?? "",
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
      featured_start_date: post?.featured_start_date ?? new Date(),
      featured_end_date: post?.featured_end_date ?? new Date(),
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

    // Slug ID generation
    const maxSlug = await productService.getSelectedCol({
      table: "Setting",
      columns: ["setting_value"],
      where: { var_name: "MAX_SLUG_ID" },
    });
    save.slug_id = parseInt(maxSlug?.setting_value || 0) + 1;

    let productId = product_id;
    let uploadedImages = [];
    let uploadedDocuments = [];
    transaction = await productService.startProductBasicDetailsTransaction();

    if (isNewProduct) {
      // === STEP 2: Save product FIRST to get productId ===
      productId = await productService.saveProduct(save, transaction);
      console.log("Product saved with ID:", productId);

      // === STEP 3: Upload image (S3) + save in DB ===
      if (req.files?.image) {
        uploadedImages = await productService.saveProductImage(
          productId,
          req.files.image,
          transaction,
        );
      }

      // === STEP 4: Upload pricing documents (S3) + save in DB ===
      if (req.files?.documents) {
        uploadedDocuments = await productService.savePricingDocument(
          productId,
          req.files.documents,
          transaction,
        );
      }

      // === STEP 5: Save product description ===
      if (
        post?.brief ||
        post?.overview ||
        post?.description ||
        post?.internal_description
      ) {
        await productService.saveProductDescription({
          product_id: productId,
          brief: post?.brief ?? "",
          overview: post?.overview ?? "",
          description: post?.description ?? "",
          internal_description: post?.internal_description ?? "",
        }, transaction);
      }

      // === STEP 6: Save product categories ===
      if (post?.product_category) {
        const categories = Array.isArray(post.product_category)
          ? post.product_category
          : [post.product_category];

        await productService.replaceProductCategories({
          productId,
          categories,
          category_parent_id: post.category_parent_id,
          transaction,
        });
      }
    }
    // For UPDATES: only log to vendor_logs (pending approval)

    // === STEP 7: Log to vendor_logs ===
    const descriptionForLog =
      post?.brief || post?.overview ? { overview: post?.overview ?? "" } : null;

    const categoryIds = Array.isArray(post?.product_category)
      ? post.product_category
      : post?.product_category
      ? [post.product_category]
      : [];

    await productService.logProductSaveToVendorLogs({
      product_id: productId,
      vendor_id,
      productData: save,
      imageFileName: uploadedImages[0]?.fileName || null,
      documentFileName: uploadedDocuments[0]?.fileName || null,
      categoryIds,
      descriptionData: descriptionForLog,
      isNewProduct,
      existingRecordIds: {},
      transaction,
    });

    await transaction.commit();
    transaction = null;

    return res.status(StatusCodes.SUCCESS).json(
      SystemResponse.success("Product saved successfully", {
        product_id: productId,
        images: uploadedImages,
        documents: uploadedDocuments,
      })
    );
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error("basicDetails error:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(
        SystemResponse.internalServerError(
          error.message,
          "Internal Server Error in saving product"
        )
      );
  }
};

export const editBasicDetails = async (req, res) => {
  let transaction = null;
  try {
    const post = req.body;
    const vendor_id = req.user.vendor_id;
    const product_id = req.params.product_id;

    if (!product_id) {
       return res.status(StatusCodes.BAD_REQUEST).json(SystemResponse.badRequestError("product_id is required"));
    }

    const existing = await productService.geteditProductDetail(product_id);
    if (!existing) {
       return res.status(StatusCodes.NOT_FOUND).json(SystemResponse.badRequestError("Product not found"));
    }

    let uploadedImages = [];
    let uploadedDocuments = [];

    transaction = await productService.startProductBasicDetailsTransaction();


    if (req.files?.image) {
      uploadedImages = await productService.uploadProductImageOnly(
        product_id,
        req.files.image
      );
    }

    if (req.files?.documents) {
      uploadedDocuments = await productService.uploadPricingDocumentOnly(
        product_id,
        req.files.documents
      );
    }

    const changes = [];

    const tpFields = [
      { key: "product_name", orig: existing.product_name },
      { key: "brand_id", orig: existing.brand_id },
      { key: "website_url", orig: existing.website_url },
      { key: "trial_available", orig: existing.trial_available },
      { key: "free_downld_available", orig: existing.free_downld_available }
    ];

    tpFields.forEach(f => {
      if (post[f.key] !== undefined && post[f.key] != f.orig) {
        changes.push({
          table_name: "tbl_product",
          column_name: f.key,
          updated_column_value: post[f.key],
          p_key: "product_id",
          item_updated_id: product_id
        });
      }
    });

    if (uploadedDocuments.length > 0) {
       changes.push({
          table_name: "tbl_product",
          column_name: "pricing_document",
          updated_column_value: uploadedDocuments[0].fileName,
          p_key: "product_id",
          item_updated_id: product_id
       });
    }

    if (uploadedImages.length > 0) {
      const existingImage = await productService.getSelectedCol({
        table: "ProductImage",
        columns: ["image_id"],
        where: { product_id }
      });
      changes.push({
        table_name: "tbl_product_image",
        column_name: "product_image",
        updated_column_value: uploadedImages[0].fileName,
        p_key: "image_id",
        item_updated_id: existingImage ? existingImage.id : 0 
      });
    }

    if (post.overview !== undefined && post.overview != existing.overview) {
      const existingDesc = await productService.getSelectedCol({
        table: "ProductDescription",
        columns: ["id"],
        where: { product_id }
      });
      changes.push({
        table_name: "tbl_product_description",
        column_name: "overview",
        updated_column_value: post.overview,
        p_key: "id", 
        item_updated_id: existingDesc ? existingDesc.id : 0
      });
    }

    if (post.product_category !== undefined) {
      const categoryIds = Array.isArray(post.product_category) ? post.product_category.map(String) : [String(post.product_category)];
      const existingCats = existing.arr_cat_selected ? existing.arr_cat_selected.map(c => String(c.category_id)) : [];
      
      const newCats = categoryIds.sort().join(',');
      const oldCats = existingCats.sort().join(',');
      
      if (newCats !== oldCats) {
         for (const cat of categoryIds) {
            changes.push({
               table_name: "tbl_product_category",
               column_name: "category_id",
               updated_column_value: cat,
               p_key: "id",
               item_updated_id: 0
            });
         }
      }
    }

    if (changes.length > 0) {
       await productService.updateVendorLogs({
         item_id: product_id,
         profile_id: vendor_id,
         module: "product",
         action_performed: "updated",
         status: 0,
         changes,
         externalTransaction: transaction
       });
    }

    await transaction.commit();
    transaction = null;

    return res.status(StatusCodes.SUCCESS).json(
      SystemResponse.success("Details updated successfully. Pending admin approval.", {
        product_id: product_id
      })
    );
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("editBasicDetails error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error.message, "Internal Error"));
  }
};

// ------------Product Specification -------------------------------------------

export const getProductSpecification = async (req, res) => {
  try {
    const { product_id } = req.query;

    if (!product_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("product_id is required"));
    }

    const specification =
      await productService.getProductSpecificationDetails(product_id);

    if (!specification) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json(SystemResponse.badRequestError("No specification found for this product"));
    }

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Specification fetched successfully", specification));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal server error"));
  }
};

/* Controller to fetch all supported languages  */

export const getLanguages = async (req, res) => {
  try {
    const languages = await productService.getLanguageList();

    if (!languages || languages.length === 0) {
      return res
        .status(StatusCodes.SUCCESS)
        .json(SystemResponse.success("No languages found", []));
    }

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Languages fetched successfully", languages));
  } catch (error) {
    console.error("Error in getLanguages controller:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error"));
  }
};

export const ProductSpecification = async (req, res) => {
  try {
    const {
      product_id,
      deployment,
      device,
      operating_system,
      organization_type,
      languages,
    } = req.body;

    const vendor_id = req.user.vendor_id;

    if (!product_id || !vendor_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("product_id and vendor_id are required"));
    }

    if (!deployment || !device || !operating_system || !organization_type) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("Required fields are missing"));
    }

    const brandArr = await productService.getVendorBrands(vendor_id);
    const isVendor = await productService.isVendorProduct(product_id, brandArr);
    

    if (!isVendor) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json(SystemResponse.forbiddenError("Unauthorized: Product does not belong to vendor"));
    }

    const toCSV = (val) =>
      Array.isArray(val) ? val.join(",") : val || "";

    const productData = {
      product_id,
      deployment: toCSV(deployment),
      device: toCSV(device),
      operating_system: toCSV(operating_system),
      organization_type: toCSV(organization_type),
      languages: toCSV(languages),
    };

    const data = await productService.getSelectedCol({
      table: "ProductSpecification",
      columns: ["id"],
      where: { product_id: product_id },
      records: "single",
    });
    const id = data?.id || null;
    const result = await productService.saveOrUpdateProductSpecification(
      id,
      productData,
      vendor_id,
    );

    return res.status(StatusCodes.SUCCESS)
     .json(SystemResponse.success("Changes have been recorded successfully!", result));
     } catch (error) { 
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError({
        message: error.message
      },
        "Internal server error"));
    }
};


//--------------------------------------------features part of the form--------------

export const saveProductFeature = async (req, res) => {
  try {
    const post = req.body;

    if (!post.product_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("product_id is required"));
    }
    if (
      post.section_id === undefined ||
      post.section_id === null ||
      post.section_id === ""
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("section_id is required"));
    }

    const vendor_id = req.user.vendor_id;

    if (!vendor_id) {
       return res.status(StatusCodes.BAD_REQUEST).json(SystemResponse.badRequestError("vendor_id is required"));
    }

    // Use fid if provided (feature mapping ID), otherwise try to find it by productId + sectionId
    let id = post.fid || null;
    
    if (!id) {
      const data = await productService.getSelectedCol({
        table: "ProductFeature",
        columns: ["id"],
        where: { product_id: post.product_id, section_id: post.section_id },
        records: "single",
      });
      id = data?.id || null;
    }

    const result = await productService.saveOrUpdateProductFeature(id, post, vendor_id);

    if (result.action === "none") {
      return res.status(StatusCodes.SUCCESS).json(SystemResponse.success(result.message));
    }

    const message = result.action === "update" 
      ? "Changes recorded! We will review and update soon." 
      : "New feature request recorded! We will review and update soon.";

    return res.status(StatusCodes.SUCCESS).json(SystemResponse.success(message, { id: result.id, product_id: post.product_id }));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal server error in saving product feature"));
  }
};

//-------------function for getting the master list of features--------------------

export const getAllFeaturesList = async (req, res) => {
  try {
    const { product_id, search } = req.query;
    const vendor_id = req.user.vendor_id;
    if (product_id) {
      // Get brand array
      const brand = await productService.getVendorBrands(vendor_id);

      // Check if vendor owns this product
      const check = await productService.isVendorProduct(product_id, brand);

      if (check) {
        // Fetch all features for the product with optional search
        const allFeatures = await productService.getAllFeatures(search);

        return res
          .status(StatusCodes.SUCCESS)
          .json(SystemResponse.success("Features fetched successfully", allFeatures));
      } else {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json(SystemResponse.forbiddenError("Unauthorized: Product does not belong to vendor"));
      }
    } else {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("Product ID is required"));
    }
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error, "Internal server error in getting features list"));
  }
};

//-------------function for getting the list of the features added --------------------

export const getProductFeaturesList = async (req, res) => {
  const product_id = req.query.product_id;

  if (!product_id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(SystemResponse.badRequestError("product_id is required"));
  }

  try {
    const productFeatures = await productService.getProductFeatures(product_id);
    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Product features fetched successfully", productFeatures));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in fetching product features"));
  }
};

//-----------------------------Product Screenshots-----------------------------------------

export const getProductScreenshots = async (req, res) => {
  try {
    const { product_id } = req.query;

    if (!product_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("product_id is required"));
    }

    const screenshots = await productService.getProductScreenshots(product_id);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Screenshots fetched successfully", screenshots));
  } catch (error) {
    console.error("Error in getProductScreenshots controller:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal server error"));
  }
};

const cleanFileName = (name) => {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").toLowerCase();
};

export const addScreenshots = async (req, res) => {
  try {
    const { product_id } = req.body;
    const vendor_id = req.user.vendor_id;

    if (!product_id || !vendor_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("product_id and vendor_id are required"));
    }

    // 1. Verify vendor ownership
    const brandArr = await productService.getVendorBrands(vendor_id);
    const isVendor = await productService.isVendorProduct(product_id, brandArr);

    if (!isVendor) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json(SystemResponse.forbiddenError("Unauthorized: Product does not belong to vendor"));
    }

    // 2. Parse array-indexed payload
    let { id: ids, 'id[]': idsArr, alt_text: alt_texts, 'alt_text[]': alt_texts_arr, screenshot_hidden: hidden_screenshots, 'screenshot_hidden[]': hidden_screenshots_arr, screenshot_index: screenshot_indices, 'screenshot_index[]': screenshot_indices_arr } = req.body;
    const files = req.files || [];

    // Normalize inputs to arrays
    const toArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);
    ids = toArray(ids || idsArr);
    alt_texts = toArray(alt_texts || alt_texts_arr);
    hidden_screenshots = toArray(hidden_screenshots || hidden_screenshots_arr);
    screenshot_indices = toArray(screenshot_indices || screenshot_indices_arr);

    if (alt_texts.length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("alt_text[] is required"));
    }

    const screenshotsToProcess = [];

    // 3. Process each index i
    for (let i = 0; i < alt_texts.length; i++) {
      // Treat "0" or empty as null (new record)
      let currentId = ids[i] || null;
      if (currentId === "0" || currentId === "") currentId = null;
      const currentAlt = alt_texts[i];
      let currentImage = hidden_screenshots[i] || null;

      // Map file to index i if it exists
      // The frontend sends screenshot_index[] telling us which file belongs to which slot
      const filePos = screenshot_indices.indexOf(String(i));
      if (filePos !== -1 && files[filePos]) {
        const file = files[filePos];
        const sanitizedOriginalName = cleanFileName(file.originalname);
        const dbImageName = `${product_id}_${sanitizedOriginalName}`;
        const key = `web/assets/images/techjockey/products/screenshots/${dbImageName}`;

        await uploadfile2({ ...file, originalname: dbImageName, key });
        currentImage = dbImageName;
      }

      if (currentImage || currentAlt) {
        screenshotsToProcess.push({
          id: currentId,
          alt_text: currentAlt,
          image: currentImage
        });
      }
    }

    // 4. Log the changes
    const result = await productService.logProductScreenshotsRequest({
      productId: product_id,
      vendor_id,
      screenshotsData: screenshotsToProcess
    });

    if (result.action === "none") {
      return res
        .status(StatusCodes.SUCCESS)
        .json(SystemResponse.success("No changes detected."));
    }

    // 5. Trigger event-like payload formatting (for response/logs)
    const eventPayload = {
      "Image Alt": screenshotsToProcess.map(s => s.alt_text).filter(Boolean).join(", "),
      "Screenshot Image": screenshotsToProcess.map(s => `web/assets/images/techjockey/products/screenshots/${s.image}`).filter(Boolean).join(", ")
    };

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("We have recorded your changes! We will review and update soon.", {
        next_step: `gallery/${product_id}`,
        details: eventPayload
      }));

  } catch (error) {
    console.error("Error in addScreenshots controller:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in processing screenshots"));
  }
};

//-----------------------------Add gallery-----------------------------------------

export const addGallery = async (req, res) => {
  try {
    const { 
      product_id, 
      id: ids, 
      'id[]': idsArr,
      title: titles, 
      'title[]': titlesArr,
      desc: descriptions, 
      'desc[]': descriptionsArr,
      gallery_hidden: hidden_galleries,
      'gallery_hidden[]': hidden_galleries_arr,
      gallery_index: gallery_indices,
      'gallery_index[]': gallery_indices_arr
    } = req.body;
    
    const vendor_id = req.user.vendor_id;
    const files = req.files || [];

    if (!product_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("product_id is required"));
    }

    // 1. Verify vendor ownership
    const brandArr = await productService.getVendorBrands(vendor_id);
    const isVendor = await productService.isVendorProduct(product_id, brandArr);

    if (!isVendor) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json(SystemResponse.forbiddenError("Unauthorized: Product does not belong to vendor"));
    }

    // 2. Normalize inputs
    const toArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);
    const idList = toArray(ids || idsArr);
    const titleList = toArray(titles || titlesArr);
    const descList = toArray(descriptions || descriptionsArr || req.body.description || req.body['description[]']);
    const hiddenList = toArray(hidden_galleries || hidden_galleries_arr);
    const indexList = toArray(gallery_indices || gallery_indices_arr);

    // 3. Min-3 Validation: Check if there are at least 3 non-empty slots
    let validSlotsCount = 0;
    const galleryToProcess = [];
    let fileCounter = 0;

    // The length of the request is driven by the titles/descriptions provided
    for (let i = 0; i < titleList.length; i++) {
      const currentTitle = titleList[i]?.trim();
      const currentDesc = descList[i]?.trim();
      let currentImage = hiddenList[i] || null;

      // Check for file at this index
      // If gallery_index[] is missing (e.g. Postman), we fall back to sequential mapping
      const filePos = indexList.length > 0 ? indexList.indexOf(String(i)) : fileCounter;
      
      if (filePos !== -1 && files[filePos]) {
        const file = files[filePos];
        // Clean filename: remove special characters except dot and underscore
        const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9._]+/g, "");
        const dbImageName = `${product_id}_${sanitizedOriginalName}`;
        const key = `web/assets/images/techjockey/gallery/${dbImageName}`;

        await uploadfile2({ ...file, originalname: dbImageName, key });
        currentImage = dbImageName;
        
        // Only increment counter if we used the sequential mapping
        if (indexList.length === 0) fileCounter++;
      }

      if (currentTitle && currentDesc && currentImage) {
        validSlotsCount++;
      } else {
        console.log(`Slot ${i} invalid: title=${!!currentTitle}, desc=${!!currentDesc}, image=${!!currentImage}`);
      }

      galleryToProcess.push({
        id: idList[i] || null,
        title: currentTitle,
        description: currentDesc,
        image: currentImage
      });
    }

    if (validSlotsCount < 3) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("Please add atleast 3 gallery per product!."));
    }

    // 4. Log changes for approval instead of direct write
    const result = await productService.logProductGalleryRequest({
      productId: product_id,
      vendor_id,
      galleryData: galleryToProcess
    });

    // 5. Build event payload (comma separated strings) for response
    const eventPayload = {
      "Gallery Title": galleryToProcess.map(g => g.title).filter(Boolean).join(", "),
      "Gallery Description": galleryToProcess.map(g => g.description).filter(Boolean).join(", "),
      "Gallery Image": galleryToProcess.map(g => g.image ? `web/assets/images/techjockey/gallery/${g.image}` : "").filter(Boolean).join(", ")
    };

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("We have recorded your changes! We will review and update soon.", {
        next_step: `enrichment/${product_id}`,
        details: eventPayload,
        result
      }));

  } catch (error) {
    console.error("Error in addGallery controller:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in processing gallery"));
  }
};

export const getGalleryImages = async (req, res) => {
  try {
    const product_id = req.query.product_id || req.params.product_id;
    const vendor_id = req.user.vendor_id;
    if (!product_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("product_id is required"));
    }
    //  Verify vendor ownership
    const brandArr = await productService.getVendorBrands(vendor_id);
    const isVendor = await productService.isVendorProduct(product_id, brandArr);

    if (!isVendor) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json(SystemResponse.forbiddenError("You are not the owner of this product"));
    }

    const gallery = await productService.getGalleryImages(product_id);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Gallery fetched successfully", gallery));
  } catch (error) {
    console.error("Error in getGalleryImages controller:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal server error in fetching gallery"));
  }
};

//------------------------------Add Video-----------------------------------------

//------------------------Product Videos controllers------------------------
export const getProductVideos = async (req, res) => {
  try {
    const { product_id } = req.query;
    const vendor_id = req.user.vendor_id;

    if (!product_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("product_id is required"));
    }

    // 1. Verify vendor ownership
    const brandArr = await productService.getVendorBrands(vendor_id);
    const isVendor = await productService.isVendorProduct(product_id, brandArr);

    if (!isVendor) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json(SystemResponse.forbiddenError("Unauthorized: Product does not belong to vendor"));
    }

    const videos = await productService.getProductVideos(product_id);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Videos fetched successfully", videos));
  } catch (error) {
    console.error("Error in getProductVideos controller:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in fetching videos"));
  }
};

export const addVideo = async (req, res) => {
  try {
    const { 
      product_id, 
      video_id, 
      'video_id[]': videoIdArr,
      video_url, 
      'video_url[]': videoUrlArr,
      video_title,
      'video_title[]': videoTitleArr
    } = req.body;
    
    const vendor_id = req.user.vendor_id;

    if (!product_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("product_id is required"));
    }

    // 1. Verify vendor ownership
    const brandArr = await productService.getVendorBrands(vendor_id);
    const isVendor = await productService.isVendorProduct(product_id, brandArr);

    if (!isVendor) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json(SystemResponse.forbiddenError("Unauthorized: Product does not belong to vendor"));
    }

    // 2. Normalize inputs (Legacy uses index-aligned arrays)
    const toArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);
    const idList = toArray(video_id || videoIdArr);
    const urlList = toArray(video_url || videoUrlArr);
    const titleList = toArray(video_title || videoTitleArr);

    if (urlList.length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("At least one video URL is required"));
    }

    // 3. Validation
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    for (const url of urlList) {
      if (url && !urlPattern.test(url)) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json(SystemResponse.badRequestError(`Invalid URL: ${url}`));
      }
    }

    const videoData = urlList.map((url, i) => ({
      id: idList[i] || null,
      video_url: url || "",
      video_title: titleList[i] || ""
    }));

    // 4. Log changes for approval
    const result = await productService.logProductVideoRequest({
      productId: product_id,
      vendor_id,
      videoData
    });

    if (result.action === "none") {
      return res
        .status(StatusCodes.SUCCESS)
        .json(SystemResponse.success("No changes detected."));
    }

    // 5. Success response with event payload
    const loggedChanges = result.changes || [];
    const eventPayload = {
      "Video Title": loggedChanges.filter(c => c.column_name === "video_title").map(c => c.updated_column_value).join(", "),
      "Video Url": loggedChanges.filter(c => c.column_name === "video_url").map(c => c.updated_column_value).join(", ")
    };

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("We have recorded your changes! We will review and update soon.", {
        next_step: "product-list",
        details: eventPayload
      }));

  } catch (error) {
    console.error("Error in addVideo controller:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in adding videos"));
  }
};

//------------------------View Product controller------------------------
export const viewProduct = async (req, res) => {
  try {
    const { product_id } = req.params;

    if (!product_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("product_id is required"));
    }

    const productData = await productService.getProductDetail(product_id);

    if (!productData) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json(SystemResponse.badRequestError("Product not found"));
    }

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Product fetched successfully", {
        active_tab: "view_product",
        product_data: productData,
      }));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in viewing product"));
  }
};

//------------------------Edit Product controller------------------------

export const checkVendorProduct = async (req, res) => {
  try {
    const { product_id } = req.body;
    const vendor_id = req.user.vendor_id;

    const brandArr = await productService.getVendorBrands(vendor_id);
    const isVendor = await productService.isVendorProduct(product_id, brandArr);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Vendor product check successful", { isVendorProduct: isVendor }));
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in check vendor product"));
  }
};

//----------------This is controller will help to get data of the existing product and show in the form for editing------------------------

export const editProduct = async (req, res) => {
  try {
    const productId = req.params.product_id;
    const replacements = { productId: productId };

    const productData = await productService.geteditProductDetail(
      replacements.productId,
    );

    if (!productData) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json(SystemResponse.badRequestError("Product not found"));
    }

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Product fetched successfully", productData));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in editing product"));
  }
};

//----------this for the enrichment part of the form-----------------
//------------------------Get Enrichment controller------------------------
export const getEnrichment = async (req, res) => {
  try {
    const { product_id } = req.query;
    const vendor_id = req.user.vendor_id;

    if (!product_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("product_id is required"));
    }

    // 1. Verify vendor ownership
    const brandArr = await productService.getVendorBrands(vendor_id);
    const isVendor = await productService.isVendorProduct(product_id, brandArr);

    if (!isVendor) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json(SystemResponse.forbiddenError("Unauthorized: Product does not belong to vendor"));
    }

    const data = await productService.getProductEnrichmentImages(product_id);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Enrichment images fetched successfully", data));
  } catch (error) {
    console.error("Error in getEnrichment:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in fetching enrichment images"));
  }
};

//----------this for the enrichment part of the form-----------------
export const enrichment = async (req, res) => {
  try {
    const { 
      product_id, 
      id: ids, 
      'id[]': idsArr,
      type: types, 
      'type[]': typesArr,
      enrichment_hidden: hidden_enrichments,
      'enrichment_hidden[]': hidden_enrichments_arr,
      enrichment_index: enrichment_indices,
      'enrichment_index[]': enrichment_indices_arr
    } = req.body;
    
    const vendor_id = req.user.vendor_id;
    const files = req.files || [];

    if (!product_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("product_id is required"));
    }

    // 1. Verify vendor ownership
    const brandArr = await productService.getVendorBrands(vendor_id);
    const isVendor = await productService.isVendorProduct(product_id, brandArr);

    if (!isVendor) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json(SystemResponse.forbiddenError("Unauthorized: Product does not belong to vendor"));
    }

    // 2. Normalize inputs
    const toArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);
    const idList = toArray(ids || idsArr);
    const typeList = toArray(types || typesArr);
    const hiddenList = toArray(hidden_enrichments || hidden_enrichments_arr);
    const indexList = toArray(enrichment_indices || enrichment_indices_arr);

    // 3. Validation: type[] is required for all slots
    if (typeList.length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("type[] is required"));
    }

    // Validation: Min 4 desktop (1) and 4 mobile (2)
    const typeCounts = typeList.reduce((acc, t) => {
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});

    const totalValid = (files.length + hiddenList.length);
    if ((typeCounts[1] || 0) < 4 || (typeCounts[2] || 0) < 4 || totalValid < 8) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("Please add 4 enrichment images for desktop and mobile view"));
    }

    // 4. Dimension & Budget Validation
    const enrichmentInfo = await productService.getProductEnrichmentImages(product_id);
    const heightMapping = enrichmentInfo.image_height_mapping;
    
    let currentDesktopHeight = 2400 - enrichmentInfo.desktop_remaining_height;
    let currentMobileHeight = 4000 - enrichmentInfo.mobile_remaining_height;

    const enrichmentToProcess = [];
    const cleanFileName = (name) => name.replace(/[^a-zA-Z0-9._-]+/g, "");

    for (let i = 0; i < typeList.length; i++) {
      const type = Number(typeList[i]);
      const currentId = idList[i] || null;
      let currentImage = hiddenList[i] || null;
      let newImageWidth = 0;
      let newImageHeight = 0;

      const filePos = indexList.length > 0 ? indexList.indexOf(String(i)) : i;
      if (files[filePos]) {
        const file = files[filePos];
        const dimensions = sizeOf(file.buffer);
        newImageWidth = dimensions.width;
        newImageHeight = dimensions.height;

        // Validation Rules
        if (type === 1) { // Desktop
          const oldHeight = currentId ? (heightMapping[currentId] || 0) : 0;
          const newTotalHeight = currentDesktopHeight - oldHeight + newImageHeight;
          if (newTotalHeight > 2400) {
            return res.status(StatusCodes.BAD_REQUEST).json(SystemResponse.badRequestError(`Desktop height budget exceeded at slot ${i+1}. Current: ${newTotalHeight}px, Max: 2400px`));
          }
          if (newImageWidth > 1260) {
            return res.status(StatusCodes.BAD_REQUEST).json(SystemResponse.badRequestError(`Desktop image width (Found: ${newImageWidth}px) exceeds 1260px at slot ${i+1}`));
          }
          currentDesktopHeight = newTotalHeight;
        } else { // Mobile
          const oldHeight = currentId ? (heightMapping[currentId] || 0) : 0;
          const newTotalHeight = currentMobileHeight - oldHeight + newImageHeight;
          if (newTotalHeight > 4000) {
            return res.status(StatusCodes.BAD_REQUEST).json(SystemResponse.badRequestError(`Mobile height budget exceeded at slot ${i+1}. Current: ${newTotalHeight}px, Max: 4000px`));
          }
          if (newImageWidth > 600) {
            return res.status(StatusCodes.BAD_REQUEST).json(SystemResponse.badRequestError(`Mobile image width (Found: ${newImageWidth}px) exceeds 600px at slot ${i+1}`));
          }
          currentMobileHeight = newTotalHeight;
        }

        // Upload
        const sanitizedName = cleanFileName(file.originalname);
        const dbImageName = `${product_id}_${sanitizedName}`;
        const key = `web/assets/images/techjockey/gallery/${dbImageName}`;
        await uploadfile2({ ...file, originalname: dbImageName, key });
        currentImage = dbImageName;
      }

      if (currentImage) {
        enrichmentToProcess.push({
          id: currentId,
          type,
          image: currentImage,
          image_width: newImageWidth,
          image_height: newImageHeight
        });
      }
    }

    // 5. Log changes
    const result = await productService.logProductEnrichmentRequest({
      productId: product_id,
      vendor_id,
      enrichmentData: enrichmentToProcess
    });

    if (result.action === "none") {
      return res
        .status(StatusCodes.SUCCESS)
        .json(SystemResponse.success("No changes detected."));
    }

    // 6. Event Payload
    const eventPayload = {
      "Enrichment Image": enrichmentToProcess.map(e => `web/assets/images/techjockey/gallery/${e.image}`).join(", ")
    };

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("We have recorded your changes! We will review and update soon.", {
        next_step: `videos/${product_id}`,
        details: eventPayload
      }));

  } catch (error) {
    console.error("Error in enrichment controller:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in processing enrichment images"));
  }
};
