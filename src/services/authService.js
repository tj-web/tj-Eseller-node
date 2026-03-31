// this file contains all auth related services , and session related services too
import { hashPassword, generateToken } from "../helpers/cryptoHelper.js";
import redis from "../db/redisService.js";
import {
  isEmailExists,
  isPhoneExists,
  createVendor,
  createVendorAuth,
  findUserByEmail,
} from "./userService.js";
import {
  sendVerificationEmail,
  sendAdminNotification,
} from "./emailService.js";
import validator from "validator";
import Vendor from "../models/vendor.js";
import sequelize from "../db/connection.js";
import EmailQueue from "../models/emailQueue.js";
import PasswordReset from "../models/auth/passwordReset.js";
import LoginHistory from "../models/auth/loginHistory.js";
import VendorAuth from "../models/auth/vendorAuth.js";
import { AppError } from "../utilis/appError.js";

export const resetPasswordService = async (token, newPassword) => {
  const record = await PasswordReset.findOne({
    where: { token },
  });

  if (!record) {
    throw new AppError("Invalid or expired token", 400);
  }

  const now = new Date();
  const createdAt = new Date(record.created_at);

  const diffHours = (now - createdAt) / (1000 * 60 * 60);

  if (diffHours > 24) {
    throw new AppError("Token expired", 400);
  }

  const user = await VendorAuth.findOne({
    where: { email: record.email },
  });

  if (!user) {
    throw new AppError("User not found", 400);
  }

  const hashedPassword = await hashPassword(newPassword);

  const transaction = await sequelize.transaction();

  try {
    await VendorAuth.update(
      { password: hashedPassword },
      {
        where: { email: record.email },
        transaction,
      },
    );

    /* update vendor */
    await Vendor.update(
      { password: hashedPassword },
      {
        where: { id: user.vendor_id },
        transaction,
      },
    );

    await transaction.commit();
    await clearAllSessionsByVendorId(user.vendor_id);

    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
// ******************************************************

export const logoutService = async (sessionId) => {
  if (!sessionId) {
    return { message: "Already logged out", expired: true };
  }

  const sessionData = await redis.get(`ci_session:${sessionId}`);

  if (!sessionData) {
    return {
      message: "Session already expired",
      expired: true,
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(sessionData);
  } catch {
    parsed = null;
  }

  const vendorId = parsed?.vendor_id;

  try {
    await redis.del(`ci_session:${sessionId}`);

    if (vendorId) {
      await redis.sRem(`vendor_sessions:${vendorId}`, sessionId);
    }
  } catch (err) {
    console.error("Redis cleanup error:", err);
  }

  if (parsed?.login_history_id) {
    try {
      await LoginHistory.update(
        { login_status: 0 },
        { where: { id: parsed.login_history_id } }
      );
    } catch (e) {
      console.error("Login history update error:", e);
    }
  }

  return {
    message: "Logout successful",
    expired: false,
  };
};

// ************************************************************************

export const forgotPasswordService = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
   throw new AppError("User not found", 400);
  }

  const { token } = generateToken();

  await PasswordReset.create({
    email: normalizedEmail,
    token,
    created_at: new Date(),
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const emailBody = `
    <h3>Reset Password</h3>
    <a href="${resetLink}">Reset Password</a>
  `;

  await EmailQueue.create({
    to: normalizedEmail,
    subject: "Reset Password",
    body: emailBody,
    type: "forget_password",
    app: "eseller",
    priority: 0,
    status: 0,
    attempts: 0,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return true;
};

// *****************************************************************************
export const registerVendor = async (data) => {
  const {
    frmtype,
    first_name,
    last_name,
    email,
    dial_code,
    contact_number,
    password,
  } = data;
    
  const normalizedEmail = email.trim().toLowerCase();
  // PHONE
  const countryMap = {
    "+91": "en-IN", // India
    "+1": "en-US",
    "+44": "en-GB",
  };

    const locale = countryMap[dial_code];

  if (!locale) {
    throw new AppError("Unsupported country code", 400);
  }

  let number = contact_number;

  if (number.startsWith("0")) {
    number = number.substring(1);
  }

  const fullNumber = `${dial_code}${number}`;

  if (!validator.isMobilePhone(fullNumber, locale, { strictMode: true })) {
    throw new AppError("Invalid phone number", 400);
  }

  // ✅ DB checks (business logic)
  if (await isEmailExists(normalizedEmail)) {
    throw new AppError("Your email is already registered", 400);
  }

  if (await isPhoneExists(dial_code, number)) {
    throw new AppError("Your phone is already registered", 400);
  }

  const hashedPassword = await hashPassword(password);
  const { token, hash } = generateToken();

  const transaction = await sequelize.transaction();

  try {
    const vendor = await createVendor(
      {
        first_name,
        last_name,
        email: normalizedEmail,

        hash_string: hash,

        dial_code,
        phone: number,

        password: hashedPassword,

        vendor_type: 1,
        signup_progress: 0,

        email_verified: 0,
        status: 1,
        admin_verified: 0,
        is_deleted: 0,

        app_dec_comment: "",
        show_popup_date: new Date(),
        registration_source: "website",

        created_at: new Date(),
      },
      transaction,
    );

    const vendorAuth = await createVendorAuth(
      {
        vendor_id: vendor.id,

        first_name,
        last_name,
        email: normalizedEmail,

        dial_code,
        phone:  number,

        password: hashedPassword,

        created_at: new Date(),

        hash_string: hash,

        email_verified: 0,
        status: 1,
        is_deleted: 0,

        is_admin: 0,
        is_acd: 1,
        admin_verified: 1,

        sort_order: 0,
      },
      transaction,
    );

    // ✅ EMAILS
    await sendVerificationEmail(normalizedEmail, token, vendor.id, transaction);

    await sendAdminNotification(
      first_name,
      last_name,
      normalizedEmail,
      dial_code,
      number,
      vendor.id,
      transaction,
    );

    await transaction.commit();

    return {
      message:
        "Signup successful. Verification email sent , check your email !",
      vendor_id: vendor.id,
      vendorAuth_id: vendorAuth.id,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/* =========================================
   CREATE SESSION
========================================= */
export const createSession = async (user, loginHistoryId = null, sessionId) => {
  const sessionData = {
    vendor_id: user.vendor_id,
    profile_id: user.id,
    v_name: user.Vendor?.first_name,
    v_lname: user.Vendor?.last_name,
    v_email: user.email,
    v_dial_code: user.dial_code,
    v_number: user.phone,
    is_temp_account: user.Vendor?.is_temp,
    vendor_mode: user.Vendor?.vendor_mode,
    v_created: user.created_at,
    v_current_plan_data: user.Vendor?.show_current_plan_data,
    v_email_verified: user.Vendor?.email_verified,
    login_history_id: loginHistoryId,
  };

  // store session
  await redis.set(`ci_session:${sessionId}`, JSON.stringify(sessionData), {
    EX: 7 * 24 * 60 * 60, // 7 days
  });

  // track all sessions , redis set for vendor sessions
  await redis.sAdd(`vendor_sessions:${user.vendor_id}`, sessionId);
  return sessionId;
};

/* =========================================
   SET COOKIE
========================================= */
export const setSessionCookie = (res, sessionId) => {
  res.cookie("session_token", sessionId, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

/* =========================================
   GET SESSION
========================================= */
export const getSession = async (sessionId) => {
  if (!sessionId) return null;

  const sessionData = await redis.get(`ci_session:${sessionId}`);

  return sessionData ? JSON.parse(sessionData) : null;
};

/* =========================================
   CLEAN INVALID SESSIONS
========================================= */ // redis set cleanup  !!!!
export const cleanInvalidSessions = async (vendorId) => {
  const sessions = await redis.sMembers(`vendor_sessions:${vendorId}`);

  for (const sessionId of sessions) {
    const exists = await redis.exists(`ci_session:${sessionId}`);

    if (!exists) {
      await redis.sRem(`vendor_sessions:${vendorId}`, sessionId);
    }
  }
};

/* =========================================
   DELETE SINGLE SESSION
========================================= */
export const destroySession = async (sessionId, vendorId) => {
  await redis.del(`ci_session:${sessionId}`);
  await redis.sRem(`vendor_sessions:${vendorId}`, sessionId);
};

/* =========================================
   DELETE ALL SESSIONS
========================================= */
export const destroyAllSessions = async (vendorId) => {
  const sessions = await redis.sMembers(`vendor_sessions:${vendorId}`);

  if (!sessions.length) return;

  const deletePromises = sessions.map((sId) => redis.del(`ci_session:${sId}`));

  await Promise.all(deletePromises);

  await redis.del(`vendor_sessions:${vendorId}`);
};

// ***************************** WILL ADD DATA TO LOGIN_HISTORY TABLE **********************

export const createLoginHistory = async (user, ip, deviceId, sessionId) => {
  try {
    const record = await LoginHistory.create({
      email_id: user.email,
      source: "website",
      login_via: "native_auth",
      ip,
      device_id: deviceId,
      login_status: 1,
      profile_id: user.id,
      auth_token: sessionId,
    });

    return record.id;
  } catch (e) {
    console.error("Login history error:", e);
    return null;
  }
};

// ****************************** Verify Password ************************
export const verifyPassword = async (inputPassword, dbPassword) => {
  const hashed = await hashPassword(inputPassword);
  return hashed === dbPassword;
};

export const clearAllSessionsByVendorId = async (vendorId) => {
  const sessions = await redis.sMembers(`vendor_sessions:${vendorId}`);

  if (!sessions.length) return;

  await LoginHistory.update(
    {
      login_status: 0,
      auth_token: null,
    },
    {
      where: {
        auth_token: {
          [Op.in]: sessions,
        },
      },
    },
  );

  // 2. Delete Redis session keys
  const deletePromises = sessions.map((sId) => redis.del(`ci_session:${sId}`));
  await Promise.all(deletePromises);

  // 3. Delete set
  await redis.del(`vendor_sessions:${vendorId}`);
};

export const changePasswordService = async (
  sessionId,
  oldPassword,
  newPassword
) => {
  if (!sessionId) {
    throw new AppError("Unauthorized", 401);
  }

  const sessionData = await redis.get(`ci_session:${sessionId}`);

  if (!sessionData) {
    throw new AppError("Session expired", 401);
  }

  let parsed;
  try {
    parsed = JSON.parse(sessionData);
  } catch {
    throw new AppError("Invalid session", 401);
  }

  const vendorId = parsed?.vendor_id;

  if (!vendorId) {
    throw new AppError("Invalid session", 401);
  }

  const user = await VendorAuth.findOne({
    where: {
      vendor_id: vendorId,
      is_deleted: 0,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const oldHashed = await hashPassword(oldPassword);

  if (user.password !== oldHashed) {
    throw new AppError("Old password incorrect", 400);
  }

  if (oldPassword === newPassword) {
    throw new AppError("New password must be different", 400);
  }

  const newHashed = await hashPassword(newPassword);

  const transaction = await sequelize.transaction();

  try {
    await VendorAuth.update(
      { password: newHashed },
      { where: { vendor_id: vendorId }, transaction }
    );

    await Vendor.update(
      { password: newHashed },
      { where: { id: vendorId }, transaction }
    );

    await transaction.commit();
    await clearAllSessionsByVendorId(vendorId);

    return true;

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};