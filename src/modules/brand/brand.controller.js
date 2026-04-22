import {
  findDifferences,
  getCurrentDateTime,
} from "../../General_Function/general_helper.js";
import {
  getVendorBrandsService,
  getVendorBrandsCountService,
  checkBrandNameService,
  addBrandService,
  getBrandByIdService,
  updateBrandService,
  viewBrandService,
  getBrandLocationService,
  requestBrandService,
  searchBrandsForRequestService,
} from "./brand.service.js";
import { uploadfile2 } from "../../utilis/s3Uploader.js";
import sequelize from "../../db/connection.js";
import VendorLog from "../../models/vendorLog.model.js";
import StatusCodes from "../../utilis/statusCodes.js";
import SystemResponse from "../../utilis/systemResponse.js";

/*******   brand-list function   ******/

export const getBrands = async (req, res) => {
  try {
    const {
      orderby,
      order,
      srch_brand_name = "",
      srch_status = "",
      limit,
      pagenumber,
    } = req.query;

    const vendor_id = req.user.vendor_id; // fixed !!

    const result = await getVendorBrandsService({
      vendor_id: vendor_id || 1, // Fallback to 1 if not provided, as requested
      orderby,
      order,
      srch_brand_name,
      srch_status,
      limit: limit || 10,
      pagenumber: pagenumber || 1,
    });
    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Brands Fetched Successfully.", result));
  } catch (error) {
    console.error("Error in fetching vendor brands:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(
        SystemResponse.internalServerError(
          "Internal Server Error in vendor brands",
        ),
      );
  }
};

/*******  brand counts by status (for tab badges)   ******/

export const getBrandsCount = async (req, res) => {
  try {
    const { srch_brand_name = "" } = req.query;
    const vendor_id = req.user.vendor_id;

    if (!vendor_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("vendor_id is required"));
    }

    const counts = await getVendorBrandsCountService(
      vendor_id,
      srch_brand_name,
    );
    return res
      .status(StatusCodes.SUCCESS)
      .json(
        SystemResponse.success("Brands Count Fetched Successfully.", counts),
      );
  } catch (error) {
    console.error("Error fetching brand counts:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(
        SystemResponse.internalServerError(
          "Internal Server Error in brand counts",
        ),
      );
  }
};

/****** Helper function for checking brand name availability ******/
export const checkBrand = async (req, res) => {
  try {
    const { brand_id, brand_name } = req.body;

    const result = await checkBrandNameService(brand_name, brand_id);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success(!result)); // true if NOT blocked
  } catch (error) {
    console.error("Error checking brand name:", error);
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

    if (req.file) {
      const fileName = req.file.originalname;
      const fileobj = {
        ...req.file,
        key: `web/assets/images/techjockey/brands/${fileName}`,
      };
      await uploadfile2({ ...fileobj, key: fileobj.originalname }); // S3 executes safely unchanged in the background
      brandData.image = fileName; // Securely locks ONLY the clean native extension string into the ORM business logic map
    }

    // Call single authoritative Service replacing manually structured transaction steps
    const result = await addBrandService(
      brandData,
      vendor_id,
      req.body.profile_id || 0,
    );

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success(result.message));
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
  const transaction = await sequelize.transaction();

  try {
    const vendor_id = req.user.vendor_id;
    const { brand_id } = req.params;

    if (!brand_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("INVALID BRAND ID"));
    }

    const brandDetails = await getBrandByIdService(vendor_id, brand_id);

    if (!brandDetails) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json(SystemResponse.notFoundError("Brand not found"));
    }

    const {
      brand_name,
      information,
      location,
      industry,
      founded_on,
      founders,
      company_size,
    } = req.body;

    let imageName = null;
    if (req.file) {
      imageName = req.file.originalname;
      await uploadfile2({ ...req.file, key: req.file.originalname });
    }

    const brandSave = {
      brand_name,
      location,
      information,
      industry,
      founded_on,
      founders,
      company_size,
      ...(imageName !== null && { image: imageName }),
    };

    const brandDiff = findDifferences(brandDetails, brandSave);

    await updateBrandService(brand_id, brandSave, transaction);

    // Native ORM Diff Recording mimicking old updateVendorLog parameters locally
    if (brandDiff && Object.keys(brandDiff).length > 0) {
      const profileId = req.body.profile_id || 0;
      const flatLogArr = Object.entries(brandDiff).map(([col, values]) => {
        const isCore = col === "brand_name" || col === "image";
        return {
          item_id: brand_id,
          module: "brand",
          action_performed: "updated",
          action_by: profileId,
          table_name: isCore ? "tbl_brand" : "tbl_brand_info",
          column_name: col,
          p_key: isCore ? "brand_id" : "id",
          updated_column_value:
            values.new !== null && values.new !== undefined
              ? values.new.toString()
              : "",
          linked_attribute: "",
          item_updated_id: brand_id,
          reject_reason: "",
          status: 0,
          created_at: new Date(),
          updated_at: new Date(),
        };
      });
      await VendorLog.bulkCreate(flatLogArr, { transaction });
    }

    await transaction.commit();

    res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Brand updated successfully"));
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error in updateBrandController:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error.message));
  }
};

/***********  Function for viewing an existing brand's information ***********/

export const view_brand = async (req, res) => {
  try {
    const { brand_id } = req.params;
    const { action } = req.query;
    const vendor_id = req.user.vendor_id;

    let brandDetails;

    if (action === "edit") {
      brandDetails = await getBrandByIdService(vendor_id, brand_id);
    } else {
      brandDetails = await viewBrandService(brand_id, vendor_id);

      const location = await getBrandLocationService(brand_id);
      brandDetails = { ...brandDetails, brand_location: location };
    }

    if (!brandDetails) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json(SystemResponse.notFoundError("INVALID BRAND ID"));
    }

    return res
      .status(StatusCodes.SUCCESS)
      .json(
        SystemResponse.success(
          "Brand details Fetched Succesfully",
          brandDetails,
        ),
      );
  } catch (error) {
    console.error("Error viewing brand data via ORM interface:", error);
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
        .json(
          SystemResponse.badRequestError(
            "Invalid payload: Please select at least one brand.",
          ),
        );
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
    console.error("Error requesting brand:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(
        SystemResponse.internalServerError(
          "Internal Server Error in requesting brand",
        ),
      );
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

    const brands = await searchBrandsForRequestService(
      vendor_id,
      srch_brand_name,
    );

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Available Brands Fetched Successfully.", brands));
  } catch (error) {
    console.error("Error searching brands for request:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Internal Server Error"));
  }
};
