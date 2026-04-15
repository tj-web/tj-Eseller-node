import { v4 as uuidv4 } from "uuid";
import VendorAuth from "../models/auth/vendorAuth.js";
import Vendor from "../models/vendor.js";
import { verifyEmailService } from "../services/emailService.js";
import { verifyOtpService, sendOtpService } from "../services/otpService.js";
import { AppError } from "../utilis/appError.js";
import {
  findUserByEmail,
} from "../services/userService.js";

import {
  generateAuthTokens,
  createLoginHistory,
  verifyPassword,
  registerVendor,
  resetPasswordService,
  forgotPasswordService,
  changePasswordService,
  logoutService,
} from "../services/authService.js";
import LoginHistory from "../models/auth/loginHistory.js";

VendorAuth.belongsTo(Vendor, { foreignKey: "vendor_id" });

/* ======================================================
   LOGIN FUNCTION
====================================================== */
export const login = async (req, res, next) => {
  const { frmtype, username, userpassword, rememberme } = req.body;

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
  const deviceId = req.headers["x-device-id"] || null;

  try {
    const user = await findUserByEmail(username);

    if (!user) {
      throw new AppError("Invalid credentials", 400);
    }

    // PASSWORD CHECK
    const isValid = await verifyPassword(userpassword, user.password);

    if (!isValid) {
      throw new AppError("Invalid credentials", 400);
    }

    if (user.Vendor.status === 0) {
      throw new AppError("Account disabled", 403);
    }

    const { accessToken, refreshToken } = generateAuthTokens(user);

    await createLoginHistory(
      user,
      ip,
      deviceId,
      refreshToken
    );

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 10 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      status: 1,
      user: {
        vendor_id: user.vendor_id,
        email: user.email,
        name: `${user.Vendor?.first_name} ${user.Vendor?.last_name}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ======================================================
   SIGNUP
====================================================== */

export const signup = async (req, res, next) => {
  try {
    const result = await registerVendor(req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// // *******************************************************************
// FORGOT PASSWORD
//  ************************************************************************

export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    await forgotPasswordService(email);

    return res.status(200).json({
      message: "Please check your Email.",
    });

  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  const { new_password, confirm_password } = req.body;
  const rawToken = req.query.token;

  const token = rawToken
    ? decodeURIComponent(rawToken).replace(/^"|"$/g, "").trim()
    : null;

  try {
    await resetPasswordService(token, new_password);

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    next(error);
  }
};

/* ======================================================
   LOGOUT 
====================================================== */
export const logOut = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (refreshToken) {
      await logoutService(refreshToken);
    }

    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
    });
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });

  } catch (error) {
    next(error);
  }
};


/* ======================================================
    CHANGE PASSWORD
====================================================== */
export const changePassword = async (req, res, next) => {
  const { old_password, new_password } = req.body;

  try {
    const vendorId = req.user?.vendor_id;

    await changePasswordService(vendorId, old_password, new_password);

    return res.status(200).json({
      message: "Password changed successfully",
    });

  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const token = req.query.token;

    await verifyEmailService(token);

    return res.status(200).json({
      message: "Email verified successfully",
    });

  } catch (error) {
    next(error);
  }
};

/* ======================================================
    OTP 
====================================================== */

export const sendOtp = async (req, res, next) => {
  const { phone_number } = req.body;

  try {
    await sendOtpService(phone_number);

    return res.status(200).json({
      message: "OTP sent successfully",
    });

  } catch (error) {
    next(error);
  }
};


export const verifyOtp = async (req, res, next) => {
  const { phone_number, otp } = req.body;

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

  const deviceId = req.headers["x-device-id"] || null;

  try {
    const result = await verifyOtpService(
      phone_number,
      otp,
      ip,
      deviceId
    );

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 10 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful via OTP",
      user: result.user,
    });

  } catch (error) {
    next(error);
  }
};