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
import {
  validateLogin,
  validateSignup,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateSendOtp,
  validateVerifyOtp,
  validateVerifyEmail,
} from "./auth.validation.js";

const router = express.Router();

router.post("/signup", validateSignup, signup);

router.post("/login", validateLogin, login);

router.post("/forgot-password", validateForgotPassword, forgotPassword);

router.post("/reset-password", validateResetPassword, resetPassword);

router.post("/verify-email", validateVerifyEmail, verifyEmail);

router.post("/send-otp", validateSendOtp, sendOtp);

router.post("/verify-otp", validateVerifyOtp, verifyOtp);

router.post("/logout", logOut);

router.post("/change-password", validateChangePassword, changePassword);

export default router;
