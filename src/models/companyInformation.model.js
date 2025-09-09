import sequelize from "../db/connection.js";


/********* GET VENDOR DATA *********/

export const getVendorData = async (profile_id) => {
  const [result] = await sequelize.query(
    `
    SELECT 
      v.is_temp,
      v.show_current_plan_data,
      v.show_popup_date,
      va.*,
      vd.designation,
      vd.company,
      vd.website,
      vd.company_address,
      vd.country,
      vd.state,
      vd.city,
      vd.pincode,
      vd.is_contact_person,
      vd.bank_name,
      vd.branch_name,
      vd.acc_holder_name,
      vd.acc_number,
      vd.ifsc_code,
      vd.cont_prsn_name,
      vd.cont_prsn_email,
      vd.cont_prsn_desg,
      vd.cont_prsn_phone,
      vd.head_office_address,
      vd.legal_entry_name,
      vd.gst_registration_type,
      vd.gst_number,
      vd.gst_document,
      vd.msmed_act,
      vd.hsn_number,
      vd.company_type,
      vd.billing_address,
      vd.billing_country,
      vd.billing_state,
      vd.billing_city,
      vd.billing_pincode,
      vd.company_logo,
      vd.pan_number,
      vd.pan_document
    FROM vendor_auth AS va
    INNER JOIN vendors AS v ON v.id = va.vendor_id
    LEFT JOIN vendor_details AS vd ON vd.vendor_id = va.vendor_id
    WHERE va.id = :profile_id
    LIMIT 1
    `,
    {
      replacements: { profile_id },
      type: sequelize.QueryTypes.SELECT,
    }
  );
  return result || null;
};

/******** GET DESIGNATION ********/
export const getDesignation = async () => {
  const results = await sequelize.query(
    `
    SELECT id, designation
    FROM tbl_designation
    WHERE status = 1 AND is_deleted = 0
    `,
    {
      type: sequelize.QueryTypes.SELECT,
    }
  );
  
  return results; // same as result_array()
};


/******** GET BILLING COUNTRY STATE CITY ********/

export const getBillingCountryStateCity = async (data) => {
  try {
    const return_data = {};

    // Country
    let country_info = {};
    if (data.billing_country) {
      country_info = await getCountryInfo(data.billing_country);
    }
    return_data.billing_country_name = country_info?.countries_name || "";

    // State
    let state_info = {};
    if (data.billing_state) {
      state_info = await getStateInfo(data.billing_state);
    }
    return_data.billing_state_name = state_info?.state_name || "";

    // City
    let city_info = {};
    if (data.billing_city) {
      city_info = await getCityInfo(data.billing_city);
    }
    return_data.billing_city_name = city_info?.city_name || "";

    return return_data;
  } catch (error) {
    console.error("Error in getBillingCountryStateCity:", error);
    throw error;
  }
};


/******** GET VENDOR COUNTRY STATE CITY ********/


export const getVendorCountryStateCity = async (data) => {
  try {
    const return_data = {};

    // Country
    let country_info = {};
    if (data.country) {
      country_info = await getCountryInfo(data.country);
    }
    return_data.country_name = country_info?.countries_name || "";

    // State
    let state_info = {};
    if (data.state) {
      state_info = await getStateInfo(data.state);
    }
    return_data.state_name = state_info?.state_name || "";

    // City
    let city_info = {};
    if (data.city) {
      city_info = await getCityInfo(data.city);
    }
    return_data.city_name = city_info?.city_name || "";

    return return_data;
  } catch (error) {
    console.error("Error in getVendorCountryStateCity:", error);
    throw error;
  }
};

/******* GET COUNTRY INFORMATION ******/
export const getCountryInfo = async (country_id) => {
  try {
    const [result] = await sequelize.query(
      `SELECT countries_id, countries_name 
       FROM tbl_countries_master 
       WHERE countries_id = :country_id 
       LIMIT 1`,
      {
        replacements: { country_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return result || null; // return single row or null
  } catch (error) {
    console.error("Error in getCountryInfo:", error);
    throw error;
  }
};

/****** GET STATE INFORMATION *****/

export const getStateInfo = async (state_id) => {
  try {
    const [result] = await sequelize.query(
      `SELECT state_id, state_name 
       FROM tbl_state_master 
       WHERE state_id = :state_id 
       LIMIT 1`,
      {
        replacements: { state_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return result || null; // return single row like row_array()
  } catch (error) {
    console.error("Error in getStateInfo:", error);
    throw error;
  }
};

/******* GET CITY INFORMATION*******/

export const getCityInfo = async (city_id) => {
  try {
    const [result] = await sequelize.query(
      `SELECT city_id, city_name
       FROM tbl_city_master
       WHERE city_id = :city_id
       LIMIT 1`,
      {
        replacements: { city_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return result || null; // mimic PHP row_array()
  } catch (error) {
    console.error("Error in getCityInfo:", error);
    throw error;
  }
};