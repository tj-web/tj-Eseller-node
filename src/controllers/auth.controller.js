import crypto from "crypto";
import { isEmailExist, isPhoneExist } from "../services/authServices.js";
import { add_vendor ,verify_email,insermail,verifyVendor} from "../models/auth.model.js";
import { generateToken } from "../services/authService.js";
import { getJson, setJson } from "../config/redisService.js";  //  move import outside

export const auth_oem = async (req, res) => {
  try {
    const { email, name, phone, password, dial_code } = req.body;

    if (!email || !name || !phone || !password || !dial_code) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }


    const is_email_exist = await isEmailExist(email);
    if (is_email_exist) {
      return res
        .status(409)
        .json({ success: false, message: "Your email is already registered with us" });
    }

    
    const is_phone_exist = await isPhoneExist(dial_code, phone);
    if (is_phone_exist) {
      return res
        .status(409)
        .json({ success: false, message: "Your phone is already registered with us" });
    }

    // Hash password with MD5
    const hashPassword = crypto.createHash("md5").update(password).digest("hex");

    // Insert into DB
    const data = await add_vendor({ name, email, hashPassword, dial_code, phone });

    const payload = {
      name: name,
      email: email,
      vendor_id: data["vendor_id"],
    };

    const token = generateToken(payload);

    
    const redisKey = `user:${data["vendor_id"]}`; 
  const redisValue = { 
  vendor_id: data["vendor_id"],  
  token, 
  name, 
  email 
};

    await setJson(redisKey, redisValue);

    //  Retrieve it back 
    const user = await getJson(redisKey);
    console.log("User in Redis:", user);

    return res
      .status(201)
      .json({ success: true, message: "Vendor registered successfully", data, token });
  } catch (error) {
    console.error("Error in auth_oem:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};



// This is for the login api 

export const login_oem = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const email_exist = await verify_email(email);
    if (!email_exist) {
      return res.status(401).json({
        success: false,
        message: "your email is not registered with us",
      });
    }

    const User = await verifyVendor(email, password);
    // console.log("Login data:", data);return;
    if (User.is_valid === true) {
      //  User is valid
      const hashPassword = crypto
        .createHash("md5")
        .update(password)
        .digest("hex");
          const payload = {
    email: email,
    password: hashPassword
  };
  const token = generateToken(payload);

      // Save user data in session (NOT in cookie directly)
      req.session.user = {
        email,
        password: hashPassword,
      };

      return res.status(200).json({
        success: true,
        message: "User successfully logged in",token,User
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Provided password is incorrect",
      });
    }
  } catch (error) {
    console.error("Error in login_oem", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};



// This controller will help for the forget password user just entered the email and it gonna save in the table they it will shoot the mail by it self 

export const resetpassword= async (req,res) =>{
  try {
    const {email}=req.body
  
    if(!email){
      return res.status(409).json({success:false,message:"please provide the email id "})
    }

    const data = await insermail(email)
    res.status(201).json({success:false,message:"Shortly you will get the mail for password reset"})
  } catch (error) {
    console.log("Error in the forget password",error)
    res.status(500).json({success:false,message:"Internal Server Error"})
  }
}