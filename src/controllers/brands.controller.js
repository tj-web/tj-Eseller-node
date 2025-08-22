import { getCurrentDateTime } from "../General_Function/general_helper.js";
import { get_vendor_brands, saveBrand } from "../models/brand.model.js";
import { checkBrandName } from "../models/brand.model.js";
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

const allCols = {

  "image_name": "",
  "banner":"",
  "banner_name":"",
  "description":"",
  "slug":"",
  "website_url":"",
  "tags":"",
  "page_title":"",
  "page_heading":"",
  "page_keyword":"",
  "page_description":"",
  "oem_onboarded_by":"",
  "agreement_attach":"",
  "lead_url":"",
  "lead_username":"",
  "lead_password":"",
  "commission_type":0,
  "commission":0,
  "commission_comment":"",
  "renewal_terms":0.0,
  "renewal_terms_comment":"",
  "payment_terms":"",
  "payment_terms_comment":"",
  "remarks":"",
  "vendor_sheet":""
};


export const addBrand = async (req, res) => {
  try {
      const is_available = await checkBrandName(req.body.brand_name);
      if(!is_available){return res.status(300).json({success:false,message:"Brand name already exists"})}


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
      vendor_sheet_rec:0,
      tj_agree_by_oem: 0,
      oem_agree_by_tj: 0,
      lead_locking:0,
      onboard_last_updated: getCurrentDateTime(),
      oem_onboarded_date: getCurrentDateTime(),
      declined_by:1
    };

    const save = {...save_brand_data,...allCols};

    const result = await saveBrand(save);
    if (result) {
      return res
        .status(200)
        .json({ success: true, message: "Brand added successfully" });
    } else
      return res
        .status(200)
        .json({ success: false, message: "Brand not added" });
  } catch (error) {}
};
