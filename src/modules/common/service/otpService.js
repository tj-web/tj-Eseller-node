import { Op } from "sequelize";
import validator from "validator";
import { v4 as uuidv4 } from "uuid";
import Otp from "../../../models/otp.model.js";
import { findUserByPhone } from "./userService.js";
import { AppError } from "../../../utilis/appError.js";
import { createLoginHistory, generateAuthTokens } from "../../auth/auth.service.js";

/* =========================================
   SEND OTP
 ========================================= */
export const sendOtpService = async (phone_number, dial_code = "91") => {
  const user = await findUserByPhone(phone_number);

  if (!user) {
    throw new AppError("Account Not Found!.", 404);
  }

  // Use the canonical phone and dial_code from the database to avoid duplicates (e.g. 91+91...)
  const dCode = user.dial_code || dial_code || "91";
  const pNumber = user.phone || phone_number;

  const payload = {
    minute: dCode === "91" ? 2 : 3,
    dial_code: dCode,
  };

  if (dCode !== "91") {
    payload.type = "email";
    payload.email = user.email;
    payload.subject = "Eseller - Verification Code";
  } else {
    payload.phone_number = pNumber;
    payload.type = "phone";
  }

  const url = `${process.env.MAINSITE_URL}tjapi/send_otp`;
  
  console.log(`Sending OTP to DialCode: ${dCode}, Phone: ${pNumber} via ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TJ_API_OTP_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  console.log("TJ API Response:", result);

  if (!result.status) {
    throw new AppError(result.msg || "Failed to send OTP", 400);
  }

  /* Log attempt - Using 'native_auth' to match DB ENUM allowed values */
  await createLoginHistory(user, "website", "eseller", null, "native_auth");

  return true;
};

/* =========================================
   VERIFY OTP
 ========================================= */
export const verifyOtpService = async (phone_number, otp, ip, deviceId, dial_code = "91") => {
  const user = await findUserByPhone(phone_number);
  if (!user) {
    throw new AppError("Account Not Found!.", 404);
  }

  const dCode = user.dial_code || dial_code || "91";
  const pNumber = user.phone || phone_number;

  const payload = {
    dial_code: dCode,
    otp: otp,
  };

  if (dCode !== "91") {
    payload.type = "email";
    payload.email = user.email;
    payload.subject = "Eseller - Verification Code";
  } else {
    payload.phone_number = pNumber;
    payload.type = "phone";
  }

  const url = `${process.env.MAINSITE_URL}tjapi/verify_otp`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TJ_API_OTP_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!result.status || result.error_code) {
    throw new AppError(result.msg || "Invalid or expired OTP", 400);
  }

  /* Successful Verification */
  const { accessToken, refreshToken } = generateAuthTokens(user);

  /* Log login - Using 'native_auth' to match DB ENUM allowed values */
  await createLoginHistory(user, ip, deviceId, refreshToken, "native_auth");

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.vendor_id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      Vendor: user.Vendor
    },
  };
};
