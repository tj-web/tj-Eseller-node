import express from "express";
import {
  login,
  signup,
  forgotPassword,
  logOut,
  resetPassword,
  changePassword,
  verifyEmail,
  sendOtp,
  verifyOtp,
} from "./auth.controller.js";
import { validateLogin } from "./Validators/loginValidation.js";
import { validateSignup } from "./Validators/signupValidation.js";
import { validateForgotPassword } from "./Validators/forgotPasswordValidation.js";
import { validateResetPassword } from "./Validators/resetPasswordValidation.js";
import { validateChangePassword } from "./Validators/changePasswordValidation.js";
import { validateSendOtp } from "./Validators/sendOtpValidation.js";
import { validateVerifyOtp } from "./Validators/verifyOtpValidation.js";

const router = express.Router();

/* ================================
   PUBLIC ROUTES
================================ */

router.post("/signup", validateSignup, signup);

router.post("/login", validateLogin, login);

router.post("/forgot-password", validateForgotPassword, forgotPassword);

router.post("/reset-password", validateResetPassword, resetPassword);

router.post("/verify-email", verifyEmail); // token based, validator optional

router.post("/send-otp", validateSendOtp, sendOtp);

router.post("/verify-otp", validateVerifyOtp, verifyOtp);

/* ================================
   PROTECTED ROUTES  , use authenticate here !
================================ */

router.post("/logout", logOut);

router.post("/change-password", validateChangePassword, changePassword);

// this should also be not be used with login middleware
// this is to verify user email , and is seperate route  !!!!

// router.post("/signup", validateSignup, signup);
// router.post("/login", validateLogin, login);
// router.post("/logout", logout);

// router.post("/forgot-password", validateForgotPassword, forgotPassword);
// router.post("/reset-password", validateResetPassword, resetPassword);
// router.post("/change-password", validateChangePassword, changePassword);

// router.post("/verify-email", validateVerifyEmail, verifyEmail);
// router.post("/send-otp", validateSendOtp, sendOtp);
// router.post("/verify-otp", validateVerifyOtp, verifyOtp);

export default router;
