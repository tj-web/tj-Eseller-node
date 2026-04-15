import * as productService from "./product.service.js";
import { uploadfile2 } from "../../utilis/s3Uploader.js";
import sequelize from "../../db/connection.js";
import fs from "fs";
import path from "path";
import sizeOf from "image-size";

export const brand_arr = async (req, res) => {
  try {
    const vendor_id = req.query.vendor_id;

    if (!vendor_id) {
      return res
        .status(400)
        .json({ status: false, message: "vendor_id is required" });
    }

    // Fetch full brand details for the vendor using the exact condition
    const brands = await productService.getVendorBrandsDetails(vendor_id);

    return res.status(200).json({
      status: true,
      message: "Brands fetched successfully",
      data: brands,
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
    const vendor_id = req.query.vendor_id;
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

    const brand_arr = await productService.getVendorBrands(vendor_id);
    console.log("Vendor brands:", brand_arr); // Debug log

    const products = await productService.getProductList(
      brand_arr,
      search_filter,
      order_by,
      order,
      limit,
      pageNumber,
    );
    console.log("Fetched products:", products); // Debug log

    return res.json({
      status: true,
      message: "Products fetched successfully",
      products,
    });
  } catch (error) {
    console.error("Error fetching vendor products:", error.message);
    res.status(500).json({ status: false, message: "Internal Server Error" });
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
    console.log("Fetched categories:", categories); // Debug log

    return res.status(200).json({
      success: true,
      categories: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ----------------------------------Add Basic details of the form ------------------------

export const basicDetails = async (req, res) => {
  try {
    const post = req.body;
    const vendor_id = req.query.vendor_id;
    // const vendorId = req.user.vendor_id; // fixed ??
    const product_id = req.params.product_id || null;

    // handle product image
    let secondImageUrl = "";
    if (req.files?.image) {
      const img = req.files.image[0];
      console.log("Product image received:", img);

      let originalName = img.originalname.replace(/\s+/g, "-");
      const key = `web/assets/images/techjockey/products/${Date.now()}-${originalName}`;
      const sanitizedImg = {
        ...img,
        originalname: originalName,
        key,
      };

      secondImageUrl = await uploadfile2(sanitizedImg);
    }

    // handle documents
    let documentUrls = [];
    let pricingDocument = "";
    if (req.files?.documents) {
      for (const doc of req.files.documents) {
        let originalName = doc.originalname.replace(/\s+/g, "-");
        const key = `web/assets/documents/techjockey/products/${Date.now()}-${originalName}`;
        const sanitizedDoc = {
          ...doc,
          originalname: originalName,
          key,
        };
        const docUrl = await uploadfile2(sanitizedDoc);
        documentUrls.push(docUrl);
        if (!pricingDocument) {
          pricingDocument = originalName; // store for later update
        }
      }
    }

    // handle other files
    // let fileUrls = [];
    // if (req.files?.file) {
    //   for (const f of req.files.file) {
    //     let originalName = f.originalname.replace(/\s+/g, "-");
    //     const key = `web/assets/files/techjockey/products/${Date.now()}-${originalName}`;
    //     const sanitizedFile = {
    //       ...f,
    //       originalname: originalName,
    //       key,
    //     };
    //     const fileUrl = await uploadfile2(sanitizedFile);
    //     fileUrls.push(fileUrl);
    //   }
    // }

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

    const maxSlug = await productService.getSelectedCol({
      table: "Setting",
      columns: ["setting_value"],
      where: { var_name: "MAX_SLUG_ID" },
    });

    save.slug_id = parseInt(maxSlug?.setting_value || 0) + 1;

    // Insert product
    const productId = await productService.saveProduct(
      save,
      secondImageUrl,
      product_id,
    );
    console.log("Product saved with ID:", productId);

    // Update pricing_document if documents were uploaded
    if (pricingDocument) {
      const pricingDocValue = `${productId}_${pricingDocument}`;
      await sequelize.query(
        `UPDATE tbl_product SET pricing_document = :pricingDoc WHERE product_id = :productId`,
        {
          replacements: { pricingDoc: pricingDocValue, productId },
          type: sequelize.QueryTypes.UPDATE,
        },
      );
    }

    // Save product category association
    if (post?.product_category) {
      // Verify product was created successfully
      if (!productId) {
        throw new Error(
          "Product ID verification failed - cannot insert categories",
        );
      }
      const categories = Array.isArray(post.product_category)
        ? post.product_category
        : [post.product_category];

      // Delete old mapping if exists
      await sequelize.query(
        `DELETE FROM tbl_product_category WHERE product_id = :productId`,
        {
          replacements: { productId },
          type: sequelize.QueryTypes.DELETE,
        },
      );

      // Insert new mappings
      for (let index = 0; index < categories.length; index++) {
        const categoryId = categories[index];
        if (categoryId) {
          let parentId;
          // If the form sent category_parent_id (from the same category search response), use it and skip a DB read.
          // Otherwise load parent_id from tbl_category (older clients / extra categories without a matching field).
          let usedClientParent = false;
          if (
            Object.prototype.hasOwnProperty.call(post, "category_parent_id")
          ) {
            const sent = post.category_parent_id;
            let raw = Array.isArray(sent)
              ? sent[index]
              : categories.length === 1
                ? sent
                : index === 0
                  ? sent
                  : undefined;
            if (raw !== undefined) {
              usedClientParent = true;
              parentId = raw === "" || raw === null ? null : parseInt(raw, 10);
              if (Number.isNaN(parentId)) parentId = null;
            }
          }

          if (!usedClientParent) {
            const [categoryData] = await sequelize.query(
              `SELECT parent_id FROM tbl_category WHERE category_id = :categoryId AND status = 1 AND show_status = 1
    AND is_deleted = 0`,
              {
                replacements: { categoryId },
                type: sequelize.QueryTypes.SELECT,
              },
            );

            if (!categoryData) {
              console.warn(
                `Category ${categoryId} not found or inactive, skipping...`,
              );
              continue;
            }

            parentId = categoryData.parent_id;
          }

          await sequelize.query(
            `INSERT INTO tbl_product_category (product_id, parent_id, category_id, sort_order, is_primary) 
             VALUES (:productId, :parentId, :categoryId, :sortOrder, :isPrimary)`,
            {
              replacements: {
                productId,
                categoryId,
                parentId, 
                sortOrder: 0,
                isPrimary: 1,
              },
              type: sequelize.QueryTypes.INSERT,
            },
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      message: "Product saved successfully",
      product_id: productId,
      // fileUrl: fileUrls.length > 0 ? fileUrls : null,
      imageUrl: secondImageUrl || null,
      documentUrls: documentUrls.length > 0 ? documentUrls : null,
    });
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ------------Product Specification -------------------------------------------

export const getProductSpecification = async (req, res) => {
  try {
    const { product_id } = req.query;

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }

    const specification =
      await productService.getProductSpecificationDetails(product_id);

    if (!specification) {
      return res
        .status(404)
        .json({
          message: "No specification found for this product",
          data: null,
        });
    }

    return res.status(200).json({
      success: true,
      message: "Specification fetched successfully",
      data: specification,
    });
  } catch (error) {
    console.error("Error fetching product specification:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/* Controller to fetch all supported languages  */

export const getLanguages = async (req, res) => {
  try {
    const languages = await productService.getLanguageList();

    if (!languages || languages.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No languages found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      count: languages.length,
      data: languages,
    });
  } catch (error) {
    console.error("Error in getLanguages controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
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
    );

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
    const post = req.body;

    if (!post.product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }
    if (
      post.section_id === undefined ||
      post.section_id === null ||
      post.section_id === ""
    ) {
      return res.status(400).json({ error: "section_id is required" });
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

//-------------function for getting the master list of features--------------------

export const getAllFeaturesList = async (req, res) => {
  try {
    const { product_id, vendor_id } = req.query;

    if (product_id) {
      // Get brand array
      const brand = await productService.getVendorBrands(vendor_id);

      // Check if vendor owns this product
      const check = await productService.isVendorProduct(product_id, brand);

      if (check) {
        // Fetch all features for the product
        const allFeatures = await productService.getAllFeatures();

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

//-------------function for getting the list of the features added --------------------

export const getProductFeaturesList = async (req, res) => {
  const product_id = req.query.product_id;

  if (!product_id) {
    return res.status(400).json({ error: "product_id is required" });
  }

  try {
    const productFeatures = await productService.getProductFeatures(product_id);
    return res.status(200).json({
      success: true,
      productFeatures,
    });
  } catch (error) {
    console.error("Error fetching feature list:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
};

//----------------------------Add screenshots----------------------------

export const addScreenshots = async (req, res) => {
  try {
    const { product_id } = req.body;
    const files = req.files; // depends on multer config
    let alt_text = req.body.alt_text; // can be string or array

    if (!product_id || !files || files.length === 0 || !alt_text) {
      // validation alt_text ke uper lagana hai..
      return res
        .status(400)
        .json({ error: "Product ID, screenshots and alt_text are required" });
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

    if (!product_id || !title || !description) {
      return res
        .status(400)
        .json({ message: "Product ID, title, and description are required" });
    }

    const files = req.files;
    // console.log("Files received for gallery:", files);

    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one image is required" });
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
    return res.status(201).json({
      message: "Gallery added/updated successfully",
      gallery: result,
    });
  } catch (error) {
    console.error("Error adding gallery:", error);
    return res.status(500).json({ error: error.message });
  }
};

//------------------------------Add Video-----------------------------------------

export const addVideo = async (req, res) => {
  try {
    console.log("Request body for videos:", req.body);
    const { product_id, data } = req.body;

    if (!product_id || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        message: "Product ID and at least one video are required",
      });
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

    return res.status(201).json({
      message: "Videos added/updated successfully",
      result,
    });
  } catch (error) {
    console.error("Error adding videos:", error);
    return res.status(500).json({ error: error.message });
  }
};

//------------------------View Product controller------------------------
export const viewProduct = async (req, res) => {
  try {
    const { product_id } = req.params;

    if (!product_id) {
      return res.redirect("/product-list");
    }

    const productData = await productService.getProductDetail(product_id);

    if (!productData) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({
      active_tab: "view_product",
      product_data: productData,
    });
  } catch (error) {
    console.error("Error fetching product:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//------------------------Edit Product controller------------------------

export const checkVendorProduct = async (req, res) => {
  try {
    const { product_id, vendor_id } = req.body;

    const brandArr = await productService.getVendorBrands(vendor_id);
    const isVendor = await productService.isVendorProduct(product_id, brandArr);

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
    const replacements = { productId: productId };

    const productData = await productService.geteditProductDetail(
      replacements.productId,
    );

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
