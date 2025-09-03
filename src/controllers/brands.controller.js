import {
  findDifferences,
  getCurrentDateTime,
} from "../General_Function/general_helper.js";
import {
  get_brand_by_id,
  get_vendor_brands,
  getBrandLocation,
  saveBrand,
  saveBrandInfo,
  saveVendorRelationBrand,
  tbl_brand_Cols,
  updateVendorLogs,
  viewBrand,
  updateBrandinfo,
  checkBrandName,
} from "../models/brand.model.js";
import { saveBrandImage } from "../utilis/brand.utility.js";
import { uploadfile2 } from "../utilis/s3Uploader.js";

export const getBrands = async (req, res) => {
  try {
    const {
      vendor_id,
      orderby,
      order,
      srch_brand_name = "",
      srch_status = "",
      limit,
      pagenumber,
    } = req.query;

    const result = await get_vendor_brands({
      vendor_id,
      orderby,
      order,
      srch_brand_name,
      srch_status,
      limit,
      pagenumber,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in fetching vendor brands:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error in vendor brands" });
  }
};

export const checkBrand = async (req, res) => {
  try {
    const { brand_id, brand_name } = req.body;

    const result = await checkBrandName(brand_name, brand_id);

    return res.status(200).json({ success: result });
  } catch (error) {
    console.error("Error checking brand name:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const addBrand = async (req, res) => {
  try {
    const is_available = await checkBrandName(req.body.brand_name);
    if (!is_available) {
      return res
        .status(300)
        .json({ success: false, message: "Brand name already exists" });
    }

    let save_brand_data = {
      brand_name: req.body.brand_name,
      image: req.body.image ?? "",
      date_added: getCurrentDateTime(),
      status: 0,
      added_by: "vendor",
      added_by_id: req.body.vendor_id,
      image_name: "",
      brand_onboarded: 0,
      part_agree_date: getCurrentDateTime(),
      vendor_sheet_rec: 0,
      tj_agree_by_oem: 0,
      oem_agree_by_tj: 0,
      lead_locking: 0,
      onboard_last_updated: getCurrentDateTime(),
      oem_onboarded_date: getCurrentDateTime(),
      declined_by: 1,
    };

    const save = { ...save_brand_data, ...tbl_brand_Cols };

    const result = await saveBrand(save);

    let save_brand_info_data = {
      tbl_brand_id: result ?? req.body.brand_id,
      location: req.body.location,
      founded_on: req.body.founded_on,
      founders: req.body.founders,
      company_size: req.body.company_size,
      information: req.body.information,
      industry: req.body.industry,
      created_at: getCurrentDateTime(),
    };
    await saveBrandInfo(save_brand_info_data);
    const brand_image = await saveBrandImage(
      req.body.image,
      save_brand_info_data.tbl_brand_id
    );
    await saveVendorRelationBrand(
      req.body.vendor_id,
      save_brand_info_data.tbl_brand_id
    );

    save_brand_data.brand_image = `${save_brand_info_data.tbl_brand_id}_${save_brand_data.image}`;

    
    delete save_brand_data.date_added;
    delete save_brand_data.status;
    delete save_brand_data.added_by;
    delete save_brand_data.added_by_id;
    delete save_brand_data.image;

    
    delete save_brand_data.tbl_brand_id;

    
    const updateArr = {
      tbl_brand: save_brand_data,
      tbl_brand_info: save_brand_info_data,
    };

    updateVendorLogs(
      updateArr,
      save_brand_info_data.tbl_brand_id,
      req.body.profile_id,
      1,
      0,
      "insert",
      "brand"
    );
    save_brand_info_data["Brand Name"] = req.body.brand_name;
    save_brand_info_data["Brand Image"] = brand_image;

    return res
      .status(200)
      .json({ success: true, message: "Brand Saved Successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBrandController = async (req, res) => {
  try {
    const { vendor_id } = req.body;
    const { brand_id } = req.params;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        message: "INVALID BRAND ID",
      });
    }

    const brandDetails = await get_brand_by_id(vendor_id, brand_id);

    if (!brandDetails) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
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

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadfile2(req.file);
    }

    const brandSave = {
      brand_name,
      location,
      information,
      industry,
      founded_on,
      founders,
      company_size,
      image: imageUrl,
    };

    const brandDiff = findDifferences(brandDetails, brandSave);

    if (brandDiff && Object.keys(brandDiff).length > 0) {
      const updateArr = {
        tbl_brand: Object.fromEntries(
          Object.entries({
            brand_name: brandDiff.brand_name?.new || "",
            brand_image: brandDiff.image?.new || "",
            p_key: "brand_id",
            update_id: brand_id,
          }).filter(([_, v]) => v !== "")
        ),

        tbl_brand_info: Object.fromEntries(
          Object.entries({
            founded_on: brandDiff.founded_on?.new || "",
            founders: brandDiff.founders?.new || "",
            company_size: brandDiff.company_size?.new || "",
            location: brandDiff.location?.new || "",
            industry: brandDiff.industry?.new || "",
            information: brandDiff.information?.new || "",
            p_key: "id",
            update_id: brandDetails.tbl_info_id, 
          }).filter(([_, v]) => v !== "")
        ),
      };

      await updateVendorLogs(
        updateArr,
        brand_id,
        vendor_id,
        0,
        brand_id,
        "updated",
        "brand"
      );
    }


    res.status(200).json({
      success: true,
      message: "Brand updated successfully",
    });
  } catch (error) {
    console.error("Error in updateBrandController:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const view_brand = async (req, res) => {
  const { brand_id } = req.params;
  const brandDetails = await viewBrand(brand_id);
  const location = await getBrandLocation(brand_id);
  const result = { ...brandDetails, brand_location: location };
  if (!result)
    return res
      .status(200)
      .json({ success: false, message: "INVALID BRAND ID" });
  return res.status(200).json({ success: true, data: result });
};
