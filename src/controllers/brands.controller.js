import { getCurrentDateTime } from "../General_Function/general_helper.js";
import {
  get_vendor_brands,
  saveBrand,
  saveBrandInfo,
  saveVendorRelationBrand,
  tbl_brand_Cols,
  updateVendorLogs,
} from "../models/brand.model.js";
import { checkBrandName } from "../models/brand.model.js";
import { saveBrandImage } from "../models/brand.utility.js";

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
    console.log(req.body);
    console.log(req.query);return;
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
    const brand_image = await saveBrandImage(req.body.image, save_brand_info_data.tbl_brand_id );
    await saveVendorRelationBrand(req.body.vendor_id, save_brand_info_data.tbl_brand_id);

    save_brand_data.brand_image = `${save_brand_info_data.tbl_brand_id}_${save_brand_data.image}`;
    
    // 2. Remove unwanted keys
    delete save_brand_data.date_added;
    delete save_brand_data.status;
    delete save_brand_data.added_by;
    delete save_brand_data.added_by_id;
    delete save_brand_data.image;

    // 3. Remove tbl_brand_id from brand info
    delete save_brand_data.tbl_brand_id;

    // 4. Prepare update object
    const updateArr = {
      tbl_brand: save_brand_data,
      tbl_brand_info: save_brand_info_data,
    };

    updateVendorLogs(updateArr,  save_brand_info_data.tbl_brand_id, req.body.profile_id, 1, 0, "insert", "brand");
    save_brand_info_data["Brand Name"] = req.body.brand_name;
    save_brand_info_data["Brand Image"] = brand_image;

    return res.status(200).json({ success: true, message:"Brand Saved Successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
