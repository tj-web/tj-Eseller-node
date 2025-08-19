// import { v4 as uuidv4 } from "uuid";
// import crypto from "crypto";
// import VendorAuth from "../models/vendorAuth.js";
// import Vendor from "../models/vendor.js";
// // import redis from "../db/redisService.js";

// VendorAuth.belongsTo(Vendor, { foreignKey: "vendor_id" });

// export const login = async (req, res) => {
//   const { frmtype, username, userpassword, rememberme } = req.body;

//   if (rememberme == 0) {
//     return res.status(400).json({ message: "Please select 'remember me'" });
//   }

//   if (frmtype !== "vendor_login") {
//     return res.status(400).json({ message: "Invalid form type" });
//   }

//   try {
//     const user = await VendorAuth.findOne({
//       where: { email: username },
//       include: [{ model: Vendor }],
//     });

//     if (!user) {
//       return res
//         .status(400)
//         .json({ message: "Invalid credentials: user not found" });
//     }

//     const hashedPassword = crypto
//       .createHash("md5")
//       .update(userpassword)
//       .digest("hex");

//     if (user.password !== hashedPassword) {
//       return res
//         .status(400)
//         .json({ message: "Invalid credentials: wrong password", status: 2 });
//     }

//     if (user.vendor.status === 0 || user.vendor.auth_status === 0) {
//       return res
//         .status(403)
//         .json({ message: "Account disabled. Contact admin.", status: 2 });
//     }

//     const sessionId = uuidv4();

//     const sessionData = {
//       vendor_id: user.vendor_id,
//       profile_id: user.id,
//       v_name: user.first_name,
//       v_lname: user.last_name,
//       v_email: user.email,
//       v_dial_code: user.dial_code,
//       v_number: user.phone,
//       is_temp_account: user.vendor.is_temp,
//       vendor_mode: user.vendor.vendor_mode,
//       v_created: user.created_at,
//       v_current_plan_data: user.vendor.show_current_plan_data,
//       v_email_verified: user.vendor.email_verified,
//     };

//     await redis.set(`ci_session:${sessionId}`, JSON.stringify(sessionData), {
//       EX: 7 * 24 * 60 * 60, // 7 days
//     });

//     const check = await redis.get(`ci_session:${sessionId}`);
//     console.log("Session stored in Redis:", check);
//     console.log(`ci_session:${sessionId}`);
//     res.cookie("session_token", sessionId, {
//       httpOnly: true,
//       secure: false,
//       sameSite: "lax",
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     res.status(200).json({
//       message: "Login successful",
//       status: 1,
//       user: {
//         id: user.id,
//         email: user.email,
//         name: `${user.first_name} ${user.last_name}`,
//       },
//     });
//   } catch (error) {
//     console.error("Error during login:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };
