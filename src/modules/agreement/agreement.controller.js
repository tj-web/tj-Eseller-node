import VendorAuth from "../../models/vendorAuth.model.js";
import {
  getCurrentDateNoHIs,
  insertRecordWithoutId,
  updateRecord,
} from "../../General_Function/general_helper.js";
import { refreshTokenResponse } from "../../utilis/tokenRefresh.js";
import { AppError } from "../../utilis/appError.js";
import SystemResponse from "../../utilis/systemResponse.js";
import StatusCodes from "../../utilis/statusCodes.js";
import {
  getAgreementProductPlans,
  getDesignation,
  getVendorAgreement,
  getVendorById,
  getVendorDetailById,
  isPreviousSigned,
  getBrands,
  getVendorMode
} from "./agreement.service.js";

export const getAgreements = async (req, res) => {
  try {
    const vendor_id = req.user?.vendor_id;
    const profile_id = req.user?.profile_id;

    if (!vendor_id || !profile_id) {
      throw new AppError("Unauthorized: Missing vendor or profile ID", StatusCodes.UNAUTHORIZED);
    }

    const arr_designation = await getDesignation();
    const basic_data = await getVendorById(profile_id);
    const profile_data = await getVendorDetailById(vendor_id);
    const agreement_data = await getVendorAgreement(vendor_id, 'V2');
    const is_previous_signed = await isPreviousSigned("v1", vendor_id);
    const brands = await getBrands(vendor_id);
    const vendor_mode = await getVendorMode(vendor_id);

    if (!brands || brands.length === 0) {
      return res.status(StatusCodes.SUCCESS).json(
        SystemResponse.success("Add or Request your brand before signing the agreement!", {})
      );
    }

    const product_list = await getAgreementProductPlans(vendor_id);

    if (!product_list || Object.keys(product_list).length === 0) {
      return res.status(StatusCodes.SUCCESS).json(
        SystemResponse.success("Add your product before signing the agreement!", {})
      );
    }

    const data = {
      active_tab: "eseller_agreement",
      title: "Agreement-Esellerhub Techjockey",
      arr_designation: arr_designation,
      basic_data: basic_data,
      profile_data: profile_data,
      agreement_data: agreement_data,
      is_previous_signed: is_previous_signed,
      brands: brands,
      product_list: product_list,
      vendor_mode: vendor_mode,
    };
    return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Agreements fetched successfully", data));
  } catch (error) {
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error.statusCode ? error.message : "Internal Server Error";
    return res.status(statusCode).json(SystemResponse.getErrorResponse(message, {}, statusCode));
  }
};

export const agreementFormController = async (req, res) => {
  try {
    const vendor_id = req.user?.vendor_id;
    const { type } = req.body;

    if (!vendor_id) {
      throw new AppError("Unauthorized: Missing vendor ID", StatusCodes.UNAUTHORIZED);
    }

    const agreement_data = await getVendorAgreement(vendor_id, "V2");

    if (type === "agreement_form") {
      let form_data = {
        version: "V2",
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        place: req.body.place,
        company: req.body.company,
        company_address: req.body.company_address,
      };

      if (agreement_data) {
        await updateRecord("vendor_agreement", { id: agreement_data.id }, form_data);
      } else {
        form_data = {
          ...form_data,
          vendor_id: vendor_id,
          is_signed: 0,
          agreement_by: "",
        };
        await insertRecordWithoutId("vendor_agreement", form_data);
      }
      return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Company Details Updated Successfully", {}));
    }

    if (type === "acceptance_form") {
      const { agreement_by } = req.body;
      if (!agreement_data || !agreement_data.company) {
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Update your details first.", {}));
      } else {
        const data = {
          agreement_date: getCurrentDateNoHIs(),
          agreement_by: agreement_by,
          is_signed: 1,
        };
        const updateResult = await updateRecord("vendor_agreement", { id: agreement_data.id }, data);
        if (updateResult) {
          await updateRecord("vendors", { id: vendor_id }, { vendor_mode: 2 });
          const decoded = await refreshTokenResponse(req, res);
          return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Agreement Signed Successfully", { vendor_mode: decoded?.vendor_mode ?? 0 }));
        }
        else {
          throw new AppError("Problem in updating.", StatusCodes.INTERNAL_SERVER_ERROR);
        }
      }
    }

    throw new AppError("Invalid type provided.", StatusCodes.BAD_REQUEST);
  } catch (error) {
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error.statusCode ? error.message : "Internal Server Error";
    return res.status(statusCode).json(SystemResponse.getErrorResponse(message, {}, statusCode));
  }
};
