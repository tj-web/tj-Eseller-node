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

    // One product can have many feature rows. Each row is product_id + section_id (same as feature_id in tbl_feature).
    const data = await productService.getSelectedCol({
      table: "ProductFeature",
      columns: ["id"],
      where: { product_id: post.product_id, section_id: post.section_id },
      records: "single",
    });
    const id = data?.id || null;

    const result = await productService.saveOrUpdateProductFeature(id, post);
    if (result.action === "update") {
      return res
        .status(StatusCodes.SUCCESS)
        .json(SystemResponse.success("Feature updated", { id: result.id, product_id: post.product_id }));
    } else {
      return res
        .status(StatusCodes.CREATED)
        .json(SystemResponse.success("Changes recorded! We will review and update soon.", { id: result.id, product_id: post.product_id }));
    }
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

//----------------------------Add screenshots----------------------------

export const addScreenshots = async (req, res) => {
  try {
    const { product_id } = req.body;
    const files = req.files; // depends on multer config
    let alt_text = req.body.alt_text; // can be string or array

    if (!product_id || !files || files.length === 0 || !alt_text) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("Product ID, screenshots and alt_text are required"));
    }

    const existingRows = await productService.getSelectedCol({
      table: "ProductScreenshot",
      columns: ["id"],
      where: { product_id: product_id },
      records: "all", 
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
      const dbImageName = `${product_id}_${originalName}`;
      const key = `web/assets/images/techjockey/products/screenshots/${Date.now()}-${originalName}`;

      // Upload to S3
      // NOTE: `uploadfile2` ignores `key` and uses `file.originalname` for S3 Key.
      // So we change `originalname` temporarily to keep uploaded filename consistent with DB.
      await uploadfile2({ ...file, originalname: dbImageName, key });

      screenshotsData.push({
        product_id,
        image: dbImageName, // filename only
        alt_text: altArray[i] || null,
        id: existingRows[i]?.id || null, // attach id if exists
      });
    }
    const result =
      await productService.insertProductScreenshots(screenshotsData);

    const totalProcessed = result?.totalProcessed ?? 0;
    const message =
      totalProcessed > 0
        ? "Screenshots added/updated successfully"
        : "No changes applied";

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success(message, screenshotsData));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in adding screenshots"));
  }
};

//-----------------------------Add gallery-----------------------------------------

export const addGallery = async (req, res) => {
  try {
    const { title, description, product_id } = req.body;

    if (!product_id || !title || !description) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("Product ID, title, and description are required"));
    }

    const files = req.files;
    // console.log("Files received for gallery:", files);

    if (!files || files.length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("At least one image is required"));
    }

    // Get existing gallery ids for this product
    const existingRows = await productService.getSelectedCol({
      table: "DescriptionGallery",
      columns: ["id"],
      where: { product_id: product_id },
      records: "all", 
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

    const result = await productService.addGalleryModel(
      uploadedFiles,
      product_id,
    );
    // console.log(result);
    return res
      .status(StatusCodes.CREATED)
      .json(SystemResponse.success("Gallery added/updated successfully", result));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in adding gallery"));
  }
};

//------------------------------Add Video-----------------------------------------

export const addVideo = async (req, res) => {
  try {
    console.log("Request body for videos:", req.body);
    const { product_id, data } = req.body;

    if (!product_id || !Array.isArray(data) || data.length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("Product ID and at least one video are required"));
    }

    // Fetch all existing IDs for this product
    const existingRows = await productService.getSelectedCol({
      table: "ProductVideo",
      columns: ["id"],
      where: { product_id },
      records: "all",
    });

    // Map videos with existing IDs if updating
    const videosToProcess = data.map((v, i) => ({
      id: existingRows[i]?.id,
      product_id,
      video_title: v.video_title || "",
      video_url: v.video_url || "",
      video_desc: v.video_desc || "",
    }));

    // Save videos in DB
    const result = await productService.addVideoModel(videosToProcess);

    return res
      .status(StatusCodes.CREATED)
      .json(SystemResponse.success("Videos added/updated successfully", result));
  } catch (error) {
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
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("Type is required for each image"));
    }

    // Now validate counts per type
    const typeCount = typeArr.reduce((acc, t) => {
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});

    // Dynamic validation
    for (const t in typeCount) {
      if (typeCount[t] < 4) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json(SystemResponse.badRequestError(`Please upload at least 4 images for type ${Number(t) === 1 ? "desktop" : "mobile"}`));
      }
    }

    // Fetch existing enrichment images for this product
    const existingRows = await productService.getSelectedCol({
      table: "ProductEnrichmentImage",
      columns: ["id", "type"],
      where: { product_id },
      records: "multiple",
    });

    // Prepare enrichment data with update/insert logic
    const enrichmentData = files.map((file, index) => {
      const dimensions = sizeOf(file.buffer);

      // Match existing row by type (first match)
      const existingIndex = existingRows.findIndex(
        (row) => row.type === typeArr[index],
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

    const saved = await productService.upsertEnrichmentImages(enrichmentData);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Enrichment images processed successfully", saved));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in enrichment images"));
  }
};
