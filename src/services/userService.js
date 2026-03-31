import VendorAuth from "../models/auth/vendorAuth.js";
import Vendor from "../models/vendor.js";
import { AppError } from "../utilis/appError.js";

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
  return await VendorAuth.findOne({
    where: {
      phone,
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

