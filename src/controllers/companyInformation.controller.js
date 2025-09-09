import {
  getVendorData,
  getDesignation,
  getBillingCountryStateCity,
  getVendorCountryStateCity,
} from "../models/companyInformation.model.js";


export const company_information = async (req, res) => {
  try {
    const { profile_id } = req.body;

    let v_info = await getVendorData(parseInt(profile_id));
    if (!v_info) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }
    
    let arr_designation = await getDesignation();
    
    const billing_address = await getBillingCountryStateCity({
      billing_country: v_info.billing_country,
      billing_state: v_info.billing_state,
      billing_city: v_info.billing_city,
    });
    
    v_info.billing_country_name = billing_address.billing_country_name;
    v_info.billing_state_name = billing_address.billing_state_name;
    v_info.billing_city_name = billing_address.billing_city_name;

    const oem_address = await getVendorCountryStateCity({
      country: v_info.country,
      state: v_info.state,
      city: v_info.city,
    });
    
    v_info.country_name = oem_address.country_name;
    v_info.state_name = oem_address.state_name;
    v_info.city_name = oem_address.city_name;

    const arr = {
      vendData: v_info,
      arr_designation: arr_designation,
      active_tab: "company_information",
      current_page: "company_information",
      title: "Company Information-Esellerhub Techjockey",
    };

    return res.status(200).json({ success: true, arr });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error in company_information",
      error: error.message || error,
    });
  }
};
