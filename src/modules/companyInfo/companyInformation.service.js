import Vendor from "../../models/vendor.model.js";
import VendorAuth from "../../models/vendorAuth.model.js";
import VendorDetails from "../../models/vendorDetail.model.js";
import Designation from "../../models/designation.model.js";
import CountriesMaster from "../../models/countriesMaster.model.js";
import StateMaster from "../../models/stateMaster.model.js";
import CityMaster from "../../models/cityMaster.model.js";
import { Op } from "sequelize";

// Define Associations
VendorAuth.belongsTo(Vendor, {
  foreignKey: "vendor_id",
  targetKey: "id",
});

VendorAuth.hasOne(VendorDetails, {
  foreignKey: "vendor_id",
  sourceKey: "vendor_id",
});

/********* GET VENDOR DATA *********/
export const getVendorDataService = async ({ profile_id }) => {
  const result = await VendorAuth.findOne({
    where: { id: profile_id },
    include: [
      {
        model: Vendor,
        required: true,
      },
      {
        model: VendorDetails,
        required: false,
      },
    ],
  });

  if (!result) return null;

  const va = result.toJSON();
  const v = va.Vendor || {};
  const vd = va.VendorDetail || {};

  // Combine results into a flat object to maintain compatibility with the controller/frontend
  return {
    ...va,
    is_temp: v.is_temp,
    show_current_plan_data: v.show_current_plan_data,
    show_popup_date: v.show_popup_date,
    ...vd,
  };
};

/******** GET DESIGNATION ********/
export const getDesignationService = async () => {
  return await Designation.findAll({
    where: {
      status: 1,
      is_deleted: 0,
    },
    attributes: ["id", "designation"],
    raw: true,
  });
};

/******** GET MASTER LOCATION INFO (Internal Helpers) ********/
export const getCountryInfoService = async (country_id) => {
  return await CountriesMaster.findOne({
    where: { countries_id: country_id },
    attributes: ["countries_id", "countries_name"],
    raw: true,
  });
};

export const getStateInfoService = async (state_id) => {
  return await StateMaster.findOne({
    where: { state_id: state_id },
    attributes: ["state_id", "state_name"],
    raw: true,
  });
};

export const getCityInfoService = async (city_id) => {
  return await CityMaster.findOne({
    where: { city_id: city_id },
    attributes: ["city_id", "city_name"],
    raw: true,
  });
};

/******** GET BILLING ADDRESS NAMES ********/
export const getBillingCountryStateCityService = async (data) => {
  const return_data = {
    billing_country_name: "",
    billing_state_name: "",
    billing_city_name: "",
  };

  if (data.billing_country) {
    const country = await getCountryInfoService(data.billing_country);
    return_data.billing_country_name = country?.countries_name || "";
  }

  if (data.billing_state) {
    const state = await getStateInfoService(data.billing_state);
    return_data.billing_state_name = state?.state_name || "";
  }

  if (data.billing_city) {
    const city = await getCityInfoService(data.billing_city);
    return_data.billing_city_name = city?.city_name || "";
  }

  return return_data;
};

/******** GET VENDOR ADDRESS NAMES ********/
export const getVendorCountryStateCityService = async (data) => {
  const return_data = {
    country_name: "",
    state_name: "",
    city_name: "",
  };

  if (data.country) {
    const country = await getCountryInfoService(data.country);
    return_data.country_name = country?.countries_name || "";
  }

  if (data.state) {
    const state = await getStateInfoService(data.state);
    return_data.state_name = state?.state_name || "";
  }

  if (data.city) {
    const city = await getCityInfoService(data.city);
    return_data.city_name = city?.city_name || "";
  }

  return return_data;
};

/* 1. UPDATE VENDOR AUTH */
export const updateVendorAuthService = async (profile_id, data) => {
  return await VendorAuth.update(
    {
      first_name: data.first_name,
      last_name: data.last_name,
    },
    {
      where: { id: profile_id },
    }
  );
};

/* 2. UPDATE VENDOR DETAILS */
export const updateVendorDetailsService = async (vendor_id, data) => {
  const allowedFields = [
    "company",
    "designation",
    "website",
    "company_address",
    "country",
    "state",
    "city",
    "pincode",
    "gst_registration_type",
    "pan_number",
    "gst_number",
    "gst_document",
    "pan_document",
    "is_contact_person",
    "cont_prsn_name",
    "cont_prsn_email",
    "cont_prsn_desg",
    "cont_prsn_phone",
    "billing_address",
    "billing_country",
    "billing_state",
    "billing_city",
    "billing_pincode",
    "bank_name",
    "branch_name",
    "acc_holder_name",
    "acc_number",
    "ifsc_code",
  ];

  const updateData = {};
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  });

  if (Object.keys(updateData).length === 0) return;

  return await VendorDetails.update(updateData, {
    where: { vendor_id },
  });
};

/* 3. DYNAMIC SEARCH (Dropdowns) */
export const getSearchedLocationsService = async (search, search_by, context_id) => {
  const searchParam = search ? `%${search}%` : "%";

  if (search_by === "country") {
    return await CountriesMaster.findAll({
      where: {
        countries_name: { [Op.like]: searchParam },
      },
      attributes: [
        ["countries_id", "id"],
        ["countries_name", "text"],
      ],
      order: [["countries_name", "ASC"]],
      raw: true,
    });
  } else if (search_by === "state") {
    return await StateMaster.findAll({
      where: {
        countries_id: context_id,
        state_name: { [Op.like]: searchParam },
        status: 1,
      },
      attributes: [
        ["state_id", "id"],
        ["state_name", "text"],
      ],
      order: [["state_name", "ASC"]],
      raw: true,
    });
  } else if (search_by === "city") {
    return await CityMaster.findAll({
      where: {
        state_id: context_id,
        city_name: { [Op.like]: searchParam },
        status: 1,
      },
      attributes: [
        ["city_id", "id"],
        ["city_name", "text"],
      ],
      order: [["city_name", "ASC"]],
      raw: true,
    });
  }

  return [];
};
