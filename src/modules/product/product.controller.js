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

/*******  product counts by status (for tab badges)   ******/

export const getProductsCount = async (req, res) => {
  try {
    const vendor_id = req.user.vendor_id;
    const { srch_product_name = "" } = req.query;

    if (!vendor_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("vendor_id is required"));
    }

    const brand_arr = await productService.getVendorBrands(vendor_id);
    const counts = await productService.getVendorProductsCount(brand_arr, srch_product_name);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Product counts fetched successfully.", counts));
  } catch (error) {
    console.error("Error fetching product counts:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in product counts"));
  }
};

export const getLeadsCount = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("Product ID is required"));
    }

    const count = await productService.getProductLeadsCount(productId);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Leads fetched successfully", { product_id: productId, total_leads: count }));
  } catch (error) {
    console.error("Error in getLeadsCount:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error.message || "Internal Server Error in getLeadsCount"));
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
  try {
    const vendor_id = req.user.vendor_id;
    const product_id = req.params.product_id || null;

    const result = await productService.saveOrUpdateProductBasicDetails(
      vendor_id,
      req.body,
      req.files,
      product_id,
    );

    return res.status(StatusCodes.SUCCESS).json(
      SystemResponse.success("Product saved successfully", result)
    );
  } catch (error) {
    // Preserve existing behavior for validation-like errors
    if (error && error.message && error.message.includes("exceed maximum length")) {
      return res.status(StatusCodes.BAD_REQUEST).json(SystemResponse.badRequestError(error.message));
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
  try {
    const post = req.body;
    const vendor_id = req.user.vendor_id;
    const product_id = req.params.product_id;

    if (!product_id) {
      return res.status(StatusCodes.BAD_REQUEST).json(SystemResponse.badRequestError("product_id is required"));
    }

    const result = await productService.updateProductBasicDetails(
      vendor_id,
      product_id,
      post,
      req.files
    );

    return res.status(StatusCodes.SUCCESS).json(
      SystemResponse.success("Details updated successfully. Pending admin approval.", result)
    );
  } catch (error) {
    console.error("editBasicDetails error:", error);
    if (error.statusCode === 404) {
      return res.status(StatusCodes.NOT_FOUND).json(SystemResponse.badRequestError(error.message));
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error.message, "Internal Error"));
  }
};

// ------------Product Specification -------------------------------------------

export const getProductSpecification = async (req, res) => {
  try {
    const { product_id } = req.query;

    const specification = await productService.getProductSpecificationDetails(product_id);

    if (!specification) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json(SystemResponse.badRequestError("No specification found for this product"));
    }

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Specification fetched successfully", specification));
  } catch (error) {
    console.error("getProductSpecification error:", error);
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
    const { product_id } = req.body;
    const vendor_id = req.user.vendor_id;

    const result = await productService.updateProductSpecification(
      vendor_id,
      product_id,
      req.body
    );

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Changes have been recorded successfully!", result));
  } catch (error) {
    console.error("ProductSpecification error:", error);
    if (error.statusCode === 403) {
      return res.status(StatusCodes.FORBIDDEN).json(SystemResponse.forbiddenError(error.message));
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError({ message: error.message }, "Internal server error"));
  }
};


//--------------------------------------------features part of the form--------------

export const saveProductFeature = async (req, res) => {
  try {
    const post = req.body;
    const vendor_id = req.user.vendor_id;

    const result = await productService.updateProductFeature(vendor_id, post);

    if (result.action === "none") {
      return res.status(StatusCodes.SUCCESS).json(SystemResponse.success(result.message));
    }

    const message = result.action === "update"
      ? "Changes recorded! We will review and update soon."
      : "New feature request recorded! We will review and update soon.";

    return res.status(StatusCodes.SUCCESS).json(SystemResponse.success(message, { id: result.id, product_id: post.product_id }));
  } catch (error) {
    console.error("saveProductFeature error:", error);
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

    const allFeatures = await productService.getFeaturesListForVendor(
      vendor_id,
      product_id,
      search
    );

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Features fetched successfully", allFeatures));
  } catch (error) {
    console.error("getAllFeaturesList error:", error);
    if (error.statusCode === 403) {
      return res.status(StatusCodes.FORBIDDEN).json(SystemResponse.forbiddenError(error.message));
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error.message, "Internal server error in getting features list"));
  }
};

//-------------function for getting the list of the features added --------------------

export const getProductFeaturesList = async (req, res) => {
  try {
    const { product_id } = req.query;

    const productFeatures = await productService.getProductFeatures(product_id);
    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Product features fetched successfully", productFeatures));
  } catch (error) {
    console.error("getProductFeaturesList error:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in fetching product features"));
  }
};

//-----------------------------Product Screenshots-----------------------------------------

export const getProductScreenshots = async (req, res) => {
  try {
    const { product_id } = req.query;

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

export const addScreenshots = async (req, res) => {
  try {
    const { product_id } = req.body;
    const vendor_id = req.user.vendor_id;

    if (!product_id || !vendor_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("product_id and vendor_id are required"));
    }

    const { result, screenshotsToProcess } = await productService.updateProductScreenshots(
      product_id,
      vendor_id,
      req.body,
      req.files
    );

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

    if (error.status) {
      return res
        .status(error.status)
        .json(SystemResponse.badRequestError(error.message));
    }

    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in processing screenshots"));
  }
};

//-----------------------------Add gallery-----------------------------------------

export const addGallery = async (req, res) => {
  try {
    const { product_id } = req.body;
    const vendor_id = req.user.vendor_id;

    if (!product_id || !vendor_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("product_id and vendor_id are required"));
    }

    const { result, galleryToProcess } = await productService.updateProductGallery(
      product_id,
      vendor_id,
      req.body,
      req.files
    );

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

    if (error.status) {
      return res
        .status(error.status)
        .json(SystemResponse.badRequestError(error.message));
    }

    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in processing gallery"));
  }
};

export const getGalleryImages = async (req, res) => {
  try {
    const product_id = req.query.product_id;
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
    const { product_id } = req.body;
    const vendor_id = req.user.vendor_id;

    if (!product_id || !vendor_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("product_id and vendor_id are required"));
    }

    const { result, videoData } = await productService.updateProductVideo(
      product_id,
      vendor_id,
      req.body
    );

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

    if (error.status) {
      return res
        .status(error.status)
        .json(SystemResponse.badRequestError(error.message));
    }

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
    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Vendor product check successful", { isVendorProduct: true }));
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in check vendor product"));
  }
};

//----------------This is controller will help to get data of the existing product and show in the form for editing------------------------

export const editProduct = async (req, res) => {
  try {
    const product_id = req.params.product_id;

    const data = await productService.geteditProductDetail(product_id);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Product details fetched successfully", data));
  } catch (error) {
    console.error("Error in editProduct:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in fetching product details"));
  }
};

export const getEnrichment = async (req, res) => {
  try {
    const product_id = req.query.product_id;
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
    const { product_id } = req.body;
    const vendor_id = req.user?.vendor_id;
    console.log('rrrrrrrr', product_id, vendor_id);
    const { result, enrichmentToProcess } = await productService.updateProductEnrichment(
      product_id,
      vendor_id,
      req.body,
      req.files
    );
    console.log('enrichment result', result, enrichmentToProcess);
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
