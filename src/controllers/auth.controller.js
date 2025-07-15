import bcrypt from "bcryptjs";
import VendorAuth from "../models/vendorAuth.js";
import authValidation from "../validation/authValidation.js";
let users = [];

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: users.length + 1,
      fullName,
      email,
      password: hashedPassword,
    };

    users.push(newUser); // Save to in-memory array

    console.log("New user created:", newUser);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Error in signup controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// import crypto from "crypto";

// export const login = async (req, res) => {
//   const { frmtype, username, userpassword, rememberme } = req.body;

//   console.log(" Received login payload:", req.body);

//   if (rememberme==0) {
//     return res.status(400).json({ message: "please add remember me" });
//   }

//   if (frmtype !== "vendor_login") {
//     return res.status(400).json({ message: "Invalid form type" });
//   }

//   try {
//     const user = await VendorAuth.findOne({ where: { email: username } });

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

//     console.log(`Login successful for: ${user.email}`);

//     const token = authValidation(res, user);

//     res.status(200).json({
//       message: "Login successful",
//       token,
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


import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import redis from '../db/redisService.js'; // make sure redisService is correctly set up

export const login = async (req, res) => {
  const { frmtype, username, userpassword, rememberme } = req.body;
  console.log(">>>>",req.body)

  console.log("Received login payload:", req.body);

  if (rememberme == 0) {
    return res.status(400).json({ message: "Please select 'remember me'" });
  }

  if (frmtype !== "vendor_login") {
    return res.status(400).json({ message: "Invalid form type" });
  }

  try {
    const user = await VendorAuth.findOne({ where: { email: username } });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials: user not found" });
    }

    const hashedPassword = crypto
      .createHash("md5")
      .update(userpassword)
      .digest("hex");

    if (user.password !== hashedPassword) {
      return res.status(400).json({ message: "Invalid credentials: wrong password", status: 2 });
    }

    console.log(`Login successful for: ${user.email}`);

    // ✅ Create a session ID and store session data in Redis
    const sessionId = uuidv4();

    const sessionData = {
      vendor_id: user.vendor_id,
      profile_id: user.id,
      v_name: user.first_name,
      v_lname: user.last_name,
      v_email: user.email,
      v_dial_code: user.dial_code,
      v_number: user.phone,
      is_temp_account: user.is_temp,
      vendor_mode: user.vendor_mode,
      v_created: user.created_at,
      v_current_plan_data: user.show_current_plan_data,
      v_email_verified: user.email_verified,
    };

    await redis.set(`session:${sessionId}`, JSON.stringify(sessionData), 'EX', 7 * 24 * 60 * 60); // 7 days

    // ✅ Set session token in cookie
    res.cookie('session_token', sessionId, {
      httpOnly: true,
      secure: false, // set to true if using HTTPS
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ✅ Send success response
    res.status(200).json({
      message: "Login successful",
      status: 1,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
      },
    });

  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



export const logout = (req, res) => {
  try {
    res.clearCookie("jwt");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
