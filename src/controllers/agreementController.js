import {
  getCurrentDateNoHIs,
  insertRecordWithoutId,
  updateRecord,
} from "../helpers/generalHelper.js";
import {
  getAgreementProductPlans,
  getDesignation,
  getVendorAgreement,
  getVendorById,
  getVendorDetailById,
  isPreviousSigned,
  getBrands,
} from "../models/agreement.model.js";

export const getAgreements = async (req, res) => {
  const { vendor_id, profile_id } = req.body;

  const arr_designation = await getDesignation();
  const basic_data = await getVendorById(profile_id);
  const profile_data = await getVendorDetailById(vendor_id);
  const agreement_data = await getVendorAgreement(vendor_id, "V2");
  const is_previous_signed = await isPreviousSigned("v1", vendor_id);
  const brands = await getBrands(vendor_id);
  if (!brands) {
    return res.status(200).json({
      success: false,
      message: "Add or Request your brand before signing the agreement!",
    });
  }

  const product_list = await getAgreementProductPlans(vendor_id);

  if (!product_list) {
    return res.status(200).json({
      success: false,
      message: "Add your product before signing the agreement!",
    });
  }

  const data = {
    active_tab: "eseller_agreement",
    title: "agreement-Esellerhub Techjockey",
    arr_designation: arr_designation,
    basic_data: basic_data,
    profile_data: profile_data,
    agreement_data: agreement_data,
    is_previous_signed: is_previous_signed,
    brands: brands,
    product_list: product_list,
  };
  return res.status(200).json({ success: true, data });
};

export const agreementFormController = async (req, res) => {
  const { vendor_id, profile_id } = req.body;
  const agreement_data = await getVendorAgreement(vendor_id, "WEB_VERSION");
  if (req.body.type === "agreement_form") {
    let form_data = {
      version: req.body.version ?? "v1",
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      place: req.body.place,
      company: req.body.company,
      company_address: req.body.company_address,
      agreement_by: req.body.agreement_by,
    };
    if (agreement_data) {
      await updateRecord("vendor_agreement", agreement_data.id, form_data);
    } else {
      form_data = {
        ...form_data,
        vendor_id: vendor_id,
        is_signed: 0,
      };

      await insertRecordWithoutId("vendor_agreement", form_data);
    }
  }
  if (req.body.type === "acceptance_form") {
    if (!agreement_data || !agreement_data.company) {
      return res
        .status(200)
        .json({ success: false, message: "Update your details first." });
    } else {
      const data = {
        agreement_date: getCurrentDateNoHIs(),
        agreement_by: agreement_by,
        is_signed: 1,
      };
      if (updateRecord("vendor_agreement", agreement_data.id, data)) {
        const data2 = {
          vendor_mode: 2,
        };
        await updateRecord("vendors", vendor_id, data2);
        return res
          .status(200)
          .json({ success: true, message: "Agreement Signed Successfully" });
      } else {
        return res
          .status(200)
          .json({ success: false, message: "Problem in updating." });
      }
    }
  }
};
