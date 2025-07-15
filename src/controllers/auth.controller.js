import bcrypt from "bcryptjs";
import VendorAuth from '../models/vendorAuth.js';
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

import crypto from 'crypto'; 
 
export const login = async (req, res) => {
  const { frmtype, username, userpassword } = req.body;

  console.log(" Received login payload:", req.body);


  if (frmtype !== 'vendor_login') {
    return res.status(400).json({ message: "Invalid form type" });
  }

  try {
   
    const user = await VendorAuth.findOne({ where: { email: username } });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials: user not found" });
    }


    const hashedPassword = crypto.createHash('md5').update(userpassword).digest('hex');
    
    if (user.password !== hashedPassword) {
      return res.status(400).json({ message: "Invalid credentials: wrong password" });
    }

    const fullName = `${user.first_name} ${user.last_name}`;

       console.log(`Login successful for: ${user.email}`);

     const token = authValidation(res, user.id);

  res.status(200).json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
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
