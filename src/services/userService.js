import VendorAuth from "../models/auth/vendorAuth.js";
import Vendor from "../models/vendor.js";
import VendorDetails from "../models/vendorDetail.js";
import VendorsLeads from "../models/vendorLead.js";
import { AppError } from "../utilis/appError.js";
import { Op } from "sequelize";

/* ================================
   FIND USER BY EMAIL
================================ */
export const findUserByEmail = async (email) => {
  return await VendorAuth.findOne({
    where: {
      email,
      is_deleted: 0,
    },
    include: [{ model: Vendor }],
  });
};

/* ================================
   FIND USER BY PHONE
================================ */
export const findUserByPhone = async (phone) => {
  let cleanedPhone = phone;
  if (phone.startsWith("+91") && phone.length > 3) cleanedPhone = phone.substring(3);
  else if (phone.startsWith("91") && phone.length === 12) cleanedPhone = phone.substring(2);
  else if (phone.startsWith("+1") && phone.length > 2) cleanedPhone = phone.substring(2);
  else if (phone.startsWith("+44") && phone.length > 3) cleanedPhone = phone.substring(3);

  return await VendorAuth.findOne({
    where: {
      [Op.or]: [
        { phone },
        { phone: cleanedPhone }
      ],
      is_deleted: 0,
    },
    include: [{ model: Vendor }],
  });
};

/* ================================
   CHECK EMAIL EXISTS
================================ */
export const isEmailExists = async (email) => {
  const user = await VendorAuth.findOne({
    where: { email, is_deleted: 0 },
  });

  return !!user;
};

/* ================================
   CHECK PHONE EXISTS
================================ */
export const isPhoneExists = async (dial_code, phone) => {
  const user = await VendorAuth.findOne({
    where: {
      dial_code,
      phone,
      is_deleted: 0,
    },
  });

  return !!user;
};

/* ================================
   CREATE VENDOR
================================ */
export const createVendor = async (data, transaction) => {
  return await Vendor.create(data, { transaction });
};

/* ================================
   CREATE VENDOR AUTH
================================ */
export const createVendorAuth = async (data, transaction) => {
  return await VendorAuth.create(data, { transaction });
};

/* ================================
   CREATE VENDOR DETAILS
================================ */
export const createVendorDetails = async (data, transaction) => {
  return await VendorDetails.create(data, { transaction });
};

/* ================================
   CREATE VENDOR LEADS
================================ */
export const createVendorLeads = async (data, transaction) => {
  return await VendorsLeads.create(data, { transaction });
};


