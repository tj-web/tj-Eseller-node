import {
  getVendorBrandsService,
  getVendorBrandsCount,
  checkBrandNameService,
  addBrandService,
  getBrandByIdService,
  updateBrandService,
  viewBrandService,
  getBrandLocationService,
  requestBrandService,
  searchBrandsForRequestService,
} from "./brand.service.js";
import StatusCodes from "../../utilis/statusCodes.js";
import SystemResponse from "../../utilis/systemResponse.js";

/*******   brand-list function   ******/

export const getBrands = async (req, res) => {
  try {
    const { orderby, order, srch_brand_name = "", srch_status = "", brand_status, limit, pagenumber } = req.query;

    const vendor_id = req.user.vendor_id;

    const result = await getVendorBrandsService({
      vendor_id: vendor_id,
      orderby,
      order,
      srch_brand_name,
      srch_status,
      brand_status,
      limit: limit || 10,
      pagenumber: pagenumber || 1,
    });
    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Brands Fetched Successfully.", result));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in vendor brands"));
  }
};

/*******  brand counts by status (for tab badges)   ******/

export const getBrandsCount = async (req, res) => {
  try {
    const { srch_brand_name = "", brand_status } = req.query;
    const vendor_id = req.user.vendor_id;

    if (!vendor_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("vendor_id is required"));
    }

    const counts = await getVendorBrandsCount(vendor_id, srch_brand_name, brand_status);
    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Brands Count Fetched Successfully.", counts));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in brand counts"));
  }
};

/****** Helper function for checking brand name availability ******/
export const checkBrand = async (req, res) => {
  try {
    const { brand_id, brand_name } = req.body;

    const result = await checkBrandNameService(brand_name, brand_id);

    return res.status(StatusCodes.SUCCESS).json(SystemResponse.success(!result)); // true if NOT blocked
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error"));
  }
};

/*******  Main function for adding a new brand  *******/

export const addBrand = async (req, res) => {
  try {
    const brandData = {
      ...req.body,
    };

    const vendor_id = req.user.vendor_id;
    const profileId = req.user.profile_id;
    const result = await addBrandService(brandData, req.file, vendor_id, profileId);

    return res.status(StatusCodes.SUCCESS).json(SystemResponse.success(result.message));
  } catch (error) {
    if (error.statusCode === 300 || error.message.includes("already exists")) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("Brand name already exists"));
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error.message));
  }
};

/*********  Function for editing/updating the existing brand ***********/

export const updateBrand = async (req, res) => {
  try {
    const vendor_id = req.user.vendor_id;
    const profileId = req.user.profile_id;
    const { brand_id } = req.params;

    if (!brand_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("INVALID BRAND ID"));
    }

    await updateBrandService(brand_id, req.body, req.file, vendor_id, profileId);

    return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Brand updated successfully"));
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(StatusCodes.NOT_FOUND).json(SystemResponse.notFoundError(error.message));
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error.message));
  }
};

/***********  Function for viewing an existing brand's information ***********/

export const viewBrand = async (req, res) => {
  try {
    const { brand_id } = req.params;
    const { action } = req.query;
    const vendor_id = req.user.vendor_id;

    let brandDetails;

    if (action === "edit") {
      brandDetails = await getBrandByIdService(vendor_id, brand_id);
    } else {
      const details = await viewBrandService(brand_id, vendor_id);
      if (details) {
        const location = await getBrandLocationService(brand_id);
        brandDetails = { ...details, brand_location: location };
      } else {
        brandDetails = null;
      }
    }

    if (!brandDetails) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json(SystemResponse.notFoundError("INVALID BRAND ID"));
    }

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Brand details Fetched Succesfully", brandDetails));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal server crash"));
  }
};

/***********  Function for Requesting a brand ***********/
export const requestBrand = async (req, res) => {
  try {
    const { brand } = req.body;
    const vendor_id = req.user.vendor_id;

    if (!brand || !Array.isArray(brand) || brand.length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("Invalid payload: Please select at least one brand."));
    }
    if (!vendor_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("Vendor session ID is missing."));
    }

    await requestBrandService(brand, vendor_id);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Brand requested successfully!"));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error in requesting brand"));
  }
};

/***********  Function for Searching Global Brands ***********/
export const searchBrandsForRequest = async (req, res) => {
  try {
    const { srch_brand_name = "" } = req.query;
    const vendor_id = req.user.vendor_id;

    if (!vendor_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("vendor_id is required"));
    }

    const brands = await searchBrandsForRequestService(vendor_id, srch_brand_name);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Available Brands Fetched Successfully.", brands));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error"));
  }
};
