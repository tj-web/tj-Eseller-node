import { Op } from "sequelize";
import validator from "validator";
import { v4 as uuidv4 } from "uuid";
import Otp from "../models/auth/otp.js";
import { findUserByPhone } from "./userService.js";
import { AppError } from "../utilis/appError.js";
import { createLoginHistory, generateAuthTokens } from "./authService.js";  

/* =========================================
   SEND OTP
========================================= */
export const sendOtpService = async (phone_number) => {
  if (!validator.isMobilePhone(phone_number, "any")) {
    throw new AppError("Invalid phone number", 400);
  }

  /* ---------- reuse service ---------- */
  const user = await findUserByPhone(phone_number);

  if (!user) {
    console.warn(`OTP Failed: Phone '${phone_number}' not found in database`);
    throw new AppError("Account not found for this phone number", 404);
  }

  const now = new Date();

  /* ---------- cooldown ---------- */
  const lastOtp = await Otp.findOne({
    where: { phone_number },
    order: [["created_date", "DESC"]],
  });

  if (lastOtp) {
    const diff = now - new Date(lastOtp.created_date);
    if (diff < 30 * 1000) {
      throw new AppError(
        "Wait 30 seconds before requesting OTP again",
        429
      );
    }
  }

  /* ---------- limit ---------- */
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

  const otpCount = await Otp.count({
    where: {
      phone_number,
      created_date: {
        [Op.gte]: twelveHoursAgo,
      },
    },
  });

  if (otpCount >= 5) {
    throw new AppError(
      "Maximum OTP limit reached. Try again after 12 hours.",
      429
    );
  }

  /* ---------- generate ---------- */
  const otp = Math.floor(1000 + Math.random() * 9000);
  const validTill = new Date(now.getTime() + 5 * 60 * 1000);

  try {
    await Otp.create({
      phone_number,
      otp,
      created_date: now,
      valid_till: validTill,
      is_verified: 0,
      otp_count: otpCount + 1,
      msg: `Your OTP is ${otp}`,
    });
    console.log(`Successfully saved OTP to DB for phone: ${phone_number}`);
  } catch (err) {
    console.error("Database error while creating OTP record:", err);
    throw err;
  }

  return true;
};

/* =========================================
   VERIFY OTP
========================================= */

export const verifyOtpService = async (
  phone_number,
  otp,
  ip,
  deviceId
) => {
  const now = new Date();

  /* ---------- find OTP ---------- */
  const record = await Otp.findOne({
    where: {
      phone_number,
      otp,
      is_verified: 0,
      valid_till: {
        [Op.gte]: now,
      },
    },
    order: [["created_date", "DESC"]],
  });

  if (!record) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  /* ---------- mark used ---------- */
  const updated = await Otp.update(
  { is_verified: 1 },
  {
    where: {
      id: record.id,
      is_verified: 0,
    },
  }
);

if (!updated[0]) {
  throw new AppError("OTP already used", 400);
}

  /* ---------- get user ---------- */
  const user = await findUserByPhone(phone_number);


   if (!user || user.Vendor.status === 0) {
    throw new AppError("Invalid OTP", 400);
  }

  const { accessToken, refreshToken } = generateAuthTokens(user);

  await createLoginHistory(
    user,
    ip,
    deviceId,
    refreshToken
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.vendor_id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
    },
  };
};