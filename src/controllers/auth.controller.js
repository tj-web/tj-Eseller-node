import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import VendorAuth from "../models/vendorAuth.js";
import Vendor from "../models/vendor.js";
import LoginHistory from "../models/loginHistory.js";
import EmailQueue from "../models/emailQueue.js";
import redis from "../db/redisService.js";
import sequelize from "../db/connection.js";
import PasswordReset from "../models/passwordReset.js";
import validator from "validator";

VendorAuth.belongsTo(Vendor, { foreignKey: "vendor_id" });
// whatever helpers u want to make make in helpers ! and then import !!
/* ======================================================
   LOGIN CONTROLLER
====================================================== */
export const login = async (req, res) => {
  const { frmtype, username, userpassword, rememberme } = req.body;

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  const deviceId = req.headers["x-device-id"] || null;

  if (frmtype !== "vendor_login") {
    return res.status(400).json({ message: "Invalid form type" });
  }

  if (!username || !userpassword) {
    return res.status(400).json({
      message: "Username and password are required",
    });
  }

  const normalizedUsername = username.trim().toLowerCase();

  if (rememberme == 0) {
    return res.status(400).json({
      message: "Please select remember me",
    });
  }

  try {
    const user = await VendorAuth.findOne({
      where: {
        email: normalizedUsername,
        is_deleted: 0,
      },
      include: [{ model: Vendor }],
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    //  PASSWORD CHECK
    const hashedPassword = crypto
      .createHash("md5")
      .update(userpassword)
      .digest("hex");

    if (user.password !== hashedPassword) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    //  ACCOUNT DISABLED
    if (user.Vendor.status === 0) {
      return res.status(403).json({
        message: "Account disabled. Contact admin.",
      });
    }
    // CLEAN OLD/EXPIRED SESSIONS
    const existingSessions = await redis.sMembers(
      `vendor_sessions:${user.vendor_id}`,
    );

    for (const oldSessionId of existingSessions) {
      const exists = await redis.exists(`ci_session:${oldSessionId}`);

      if (!exists) {
        await redis.sRem(`vendor_sessions:${user.vendor_id}`, oldSessionId);
      }
    }

    // SAVE LOGIN HISTORY (SUCCESS)
    let loginHistoryId = null;
    // create session
    const sessionId = uuidv4();
    try {
      const loginRecord = await LoginHistory.create({
        email_id: user.email,
        source: "website",
        login_via: "native_auth",
        ip,
        device_id: deviceId,
        login_status: 1,
        profile_id: user.id,
        auth_token: sessionId,
      });

      loginHistoryId = loginRecord.id;
    } catch (e) {
      console.error("Login history error:", e);
    }

    // crEATE SESSION

    const sessionData = {
      vendor_id: user.vendor_id,
      profile_id: user.id,
      v_name: user.first_name,
      v_lname: user.last_name,
      v_email: user.email,
      v_dial_code: user.dial_code,
      v_number: user.phone,
      is_temp_account: user.Vendor.is_temp,
      vendor_mode: user.Vendor.vendor_mode,
      v_created: user.created_at,
      v_current_plan_data: user.Vendor.show_current_plan_data,
      v_email_verified: user.Vendor.email_verified,
      login_history_id: loginHistoryId,
    };

    //  Store session
    await redis.set(`ci_session:${sessionId}`, JSON.stringify(sessionData), {
      EX: 7 * 24 * 60 * 60,
    });

    //  Track all sessions of user
    await redis.sAdd(`vendor_sessions:${user.vendor_id}`, sessionId);

    // SET COOKIE , cookies has also been deleted in logout function,
    // with same properties , make sure both are in sync ,
    // otherwise it may create issue in logout !

    res.cookie("session_token", sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      status: 1,
      user: {
        id: user.id, // this is primary key of the table vendor_auth
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

/* ======================================================
   SIGNUP CONTROLLER
====================================================== */

export const signup = async (req, res) => {

  const {
    frmtype,
    first_name,
    last_name,
    email,
    dial_code,
    contact_number,
    password,
  } = req.body;

  if (frmtype !== "vendor_register") {
    return res.status(400).json({
      message: "Invalid form type",
    });
  }

  /* ---------- EMAIL VALIDATION ---------- */
  if (!email) {
    return res.status(400).json({
      message: "Email is required",
    });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!validator.isEmail(normalizedEmail)) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  /* ---------- PHONE VALIDATION ---------- */

  if (!validator.isMobilePhone(contact_number, "any")) {
    return res.status(400).json({
      message: "Invalid phone number",
    });
  }

  // ---------------------Password validation--------------------

  if (!validator.isLength(password, { min: 8 })) {
    return res.status(400).json({
      message: "Password must be at least 8 characters",
    });
  }

  // ---------------------------------------------------------------

  let transaction; // USED IN TRY BLOCK
  try {
    /* ---------- block personal emails ---------- */

    const blockedDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "live.com",
    ];

    const domain = normalizedEmail.split("@")[1]?.toLowerCase();

    if (blockedDomains.includes(domain)) {
      return res.status(400).json({
        message: "Please use company email",
      });
    }

    /* ---------- check email ---------- */

    const emailExists = await VendorAuth.findOne({
      where: {
        email: normalizedEmail,
        is_deleted: 0,
      },
    });

    if (emailExists) {
      return res.status(400).json({
        message: "Your email is already registered",
      });
    }

    /* ---------- check phone ---------- */

    const phoneExists = await VendorAuth.findOne({
      where: {
        dial_code,
        phone: contact_number,
        is_deleted: 0,
      },
    });

    if (phoneExists) {
      return res.status(400).json({
        message: "Your phone is already registered",
      });
    }

    /* ---------- hash password ---------- */

    const hashedPassword = crypto
      .createHash("md5")
      .update(password)
      .digest("hex");
    /* ---------- email verification hash ---------- */

    const hash_string = crypto
      .createHash("md5")
      .update(Math.random().toString())
      .digest("hex");

    /* ---------- create vendor ---------- */
    transaction = await sequelize.transaction();
    const vendor = await Vendor.create(
      {
        first_name,
        last_name,
        email: normalizedEmail,

        hash_string,

        dial_code,
        phone: contact_number,

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
      { transaction },
    );

    /* ---------- create vendor_auth ---------- */
    const vendorAuth = await VendorAuth.create(
      {
        vendor_id: vendor.id,

        first_name,
        last_name,
        email: normalizedEmail,

        dial_code,
        phone: contact_number,

        password: hashedPassword,

        created_at: new Date(),

        hash_string,

        email_verified: 0,
        status: 1,
        is_deleted: 0,

        is_admin: 0,
        is_acd: 1,
        admin_verified: 1,

        sort_order: 0,
      },
      { transaction },
    );

    /* ---------- verification email TO USER---------- */

    const verifyLink = `${process.env.FRONTEND_URL}/email_verification?email=${encodeURIComponent(normalizedEmail)}&hash=${hash_string}`;

    const emailBody = `
      <h3>Email Verification</h3>
      <p>Please verify your email:</p>
      <a href="${verifyLink}">Verify Email</a>
    `;

    /* ---------- insert email queue ---------- */

    await EmailQueue.create(
      {
        to: normalizedEmail,
        cc: "support@techjockey.com",

        subject: "Verify your email",

        body: emailBody,

        from_name: "Anand Tripathi",
        from_email: "noreply@techjockey.com",

        type: "email_verification",
        app: "eseller",

        priority: 0,

        status: 0,
        attempts: 0,

        table_column: "vendor_id",
        column_value: vendor.id,

        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction },
    );
    /* ---------- email to ADMIN for approval ---------- */

    const adminEmailBody = `
  <h3>New Vendor Registration</h3>
  <p>A new vendor has registered on the platform.</p>

  <p><strong>Name:</strong> ${first_name} ${last_name}</p>
  <p><strong>Email:</strong> ${normalizedEmail}</p>
  <p><strong>Phone:</strong> ${dial_code} ${contact_number}</p>
`;

    await EmailQueue.create(
      {
        to: process.env.ADMIN_EMAIL, // admin email
        cc: "support@techjockey.com",

        subject: "Vendor Registration",

        body: adminEmailBody,

        from_name: "Anand Tripathi",
        from_email: "noreply@techjockey.com",

        type: "admin_verification",
        app: "eseller",

        priority: 0,

        status: 0,
        attempts: 0,

        table_column: "vendor_id",
        column_value: vendor.id,

        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction },
    );

    await transaction.commit();

    res.status(201).json({
      message: "Signup successful. Verification email sent and admin notified.",

      vendor_id: vendor.id,
      vendorAuth_id: vendorAuth.id,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    console.error("Signup error:", error);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
// *******************************************************************
// FORGOT PASSWORD CONTROLLER
// ************************************************************************
export const forgotPassword = async (req, res) => {
  const { email, frmtype } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required",
    });
  }

  if (frmtype !== "forget_password") {
    return res.status(400).json({
      message: "Invalid form type",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await VendorAuth.findOne({
      where: {
        email: normalizedEmail,
        is_deleted: 0,
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "UserName/Email does not exist in record",
      });
    }

    /* ---------- generate secure token ---------- */

    const rawToken = crypto.randomBytes(32).toString("hex");

    /* ---------- store in password_resets ---------- */

    await PasswordReset.create({
      email: normalizedEmail,
      token: rawToken,
      created_at: new Date(),
    });

    /* ---------- create reset link ---------- */

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    /* ---------- email body ---------- */

    const emailBody = `
      <h3>Reset Password</h3>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p> Above link is valid for 24 hours !</p>
    `;

    /* ---------- insert email into queue ---------- */
 
    await EmailQueue.create({
      to: normalizedEmail,
      subject: "e-Seller Hub Forget Password - TechJockey",
      body: emailBody,
      type: "forget_password",
      app: "eseller",
      priority: 0,
      status: 0,
      attempts: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });
  
    return res.status(200).json({
      message: "Please check your Email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
// ********************************************************************

// *********************LOG OUT*************************************
export const logOut = async (req, res) => {
  try {
    const sessionId = req.cookies.session_token;

    if (!sessionId) {
      return res.status(400).json({
        message: "No active session",
      });
    }

    // 1. Get session data from Redis
    const sessionData = await redis.get(`ci_session:${sessionId}`);

    if (!sessionData) {
      // Session already expired
      res.clearCookie("session_token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });

      return res.status(200).json({
        message: "Session already expired",
      });
    }

    const parsed = JSON.parse(sessionData);
    const vendorId = parsed.vendor_id;

    // 2. Delete session from Redis
    await redis.del(`ci_session:${sessionId}`);

    // 3. Remove sessionId from vendor_sessions set
    await redis.sRem(`vendor_sessions:${vendorId}`, sessionId);

    // 4. Update login_history
    try {
      await LoginHistory.update(
        { login_status: 0 },
        {
          where: {
            id: parsed.login_history_id,
          },
        },
      );
    } catch (e) {
      console.error("Login history update error:", e);
    }

    // 5. Clear cookie
    res.clearCookie("session_token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error.message);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

/* when a vendor wants to log out from all devices/sessions, this function will be 
 called, if admin wants to delete all sessions of a vendor for security reason
 there will be another function that takes vendor id as input and delete all sessions !!
*/

export const logOutAllSessions = async (req, res) => {
  try {
    const sessionId = req.cookies.session_token;

    if (!sessionId) {
      return res.status(400).json({
        message: "No active session",
      });
    }

    // 1. Get current session data
    const sessionData = await redis.get(`ci_session:${sessionId}`);

    if (!sessionData) {
      res.clearCookie("session_token");
      return res.status(200).json({
        message: "Session already expired",
      });
    }

    const parsed = JSON.parse(sessionData);
    const vendorId = parsed.vendor_id;

    // 2. Get all session IDs of this user
    const sessions = await redis.sMembers(`vendor_sessions:${vendorId}`);

    if (sessions.length === 0) {
      res.clearCookie("session_token");
      return res.status(200).json({
        message: "No active sessions found",
      });
    }
    
     // . Update login history for all sessions
    try {
      await LoginHistory.update(
        { login_status: 0, auth_token: null },
        {
          where: {
            profile_id: parsed.profile_id,
          },
        },
      );
    } catch (e) {
      console.error("Login history update error:", e);
    }

    // 3. Delete all session keys (parallel for speed)
    const deletePromises = sessions.map((sId) =>
      redis.del(`ci_session:${sId}`),
    );
    await Promise.all(deletePromises);

    // 4. Delete the set itself
    await redis.del(`vendor_sessions:${vendorId}`);

   
    // 6. Clear cookie
    res.clearCookie("session_token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Logged out from all sessions",
    });
  } catch (error) {
    console.error("Logout all error:", error.message);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// ************************************************************************************
export const resetPassword = async (req, res) => {
  const { new_password, confirm_password } = req.body;
  const { token } = req.query; 
  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }
  

  if (!new_password || !confirm_password) {
    return res.status(400).json({ message: "Password fields are required" });
  }

  if (new_password !== confirm_password) {
    return res.status(400).json({ message: "Passwords do not match" });
  }
  
  if(new_password.length<8){
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  try {
    /* ---------- find token ---------- */

    const record = await PasswordReset.findOne({
      where: { token },
    });

    if (!record) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    /* ---------- check 24 hour expiry ---------- */

    const now = new Date();
    const createdAt = new Date(record.created_at);

    const diffHours = (now - createdAt) / (1000 * 60 * 60);

    if (diffHours > 24) {
      return res.status(400).json({
        message: "Token expired",
      });
    }

    /* ---------- find user ---------- */

    const user = await VendorAuth.findOne({
      where: { email: record.email },
    });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    /* ---------- hash new password ---------- */

    const hashedPassword = crypto
      .createHash("md5")
      .update(new_password)
      .digest("hex");

    /* ---------- transaction ---------- */

    const transaction = await sequelize.transaction();

    try {
      /* update vendor_auth */

      await VendorAuth.update(
        {
          password: hashedPassword,
        },
        {
          where: { email: record.email },
          transaction,
        },
      );

      /* update vendor */

      await Vendor.update(
        {
          password: hashedPassword,
        },
        {
          where: { id: user.vendor_id },
          transaction,
        },
      );

    

   
      await transaction.commit();
      await clearAllSessionsByVendorId(user.vendor_id);
      return res.status(200).json({
        message: "Password reset successful",
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const clearAllSessionsByVendorId = async (vendorId) => {
  const sessions = await redis.sMembers(`vendor_sessions:${vendorId}`);

  if (!sessions.length) return;

  await LoginHistory.update(
    {
      login_status: 0,
      auth_token: null,
    },
    {
      where: {
        auth_token: sessions, // precise
      },
    }
  );

  // 2. Delete Redis session keys
  const deletePromises = sessions.map((sId) =>
    redis.del(`ci_session:${sId}`)
  );
  await Promise.all(deletePromises);

  // 3. Delete set
  await redis.del(`vendor_sessions:${vendorId}`);
};

export const changePassword = async (req, res) => {
  const { old_password, new_password, confirm_password, frmtype } = req.body;

  if (frmtype !== "change_password") {
    return res.status(400).json({ message: "Invalid form type" });
  }

  if (!old_password || !new_password || !confirm_password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (new_password !== confirm_password) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  if (new_password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  try {
    // 🔹 Get user from session
    const sessionId = req.cookies.session_token;

    if (!sessionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sessionData = await redis.get(`ci_session:${sessionId}`);

    if (!sessionData) {
      return res.status(401).json({ message: "Session expired" });
    }

    const parsed = JSON.parse(sessionData);
    const vendorId = parsed.vendor_id;

    // 🔹 Get user
    const user = await VendorAuth.findOne({
      where: {
        vendor_id: vendorId,
        is_deleted: 0,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔹 Hash old password (MD5)
    const oldHashed = crypto
      .createHash("md5")
      .update(old_password)
      .digest("hex");

    if (user.password !== oldHashed) {
      return res.status(400).json({ message: "Old password incorrect" });
    }

    // 🔹 Hash new password
    const newHashed = crypto
      .createHash("md5")
      .update(new_password)
      .digest("hex");

    // 🔹 Transaction (update both tables)
    const transaction = await sequelize.transaction();

    try {
      await VendorAuth.update(
        { password: newHashed },
        {
          where: { vendor_id: vendorId },
          transaction,
        }
      );

      await Vendor.update(
        { password: newHashed },
        {
          where: { id: vendorId },
          transaction,
        }
      );

      await transaction.commit();

      await clearAllSessionsByVendorId(vendorId);

      return res.status(200).json({
        message: "Password changed successfully",
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};