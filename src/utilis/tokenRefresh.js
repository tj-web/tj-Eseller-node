import jwt from "jsonwebtoken";
import { findUserByEmail } from "../modules/common/service/userService.js";
import { generateAuthTokens } from "../modules/auth/auth.service.js";

/**
 * Utility to refresh authentication tokens and update cookies.
 * Used when critical user state (like vendor_mode) changes.
 * 
 * @param {Object} req - Express request object (must have req.user)
 * @param {Object} res - Express response object
 */
export const refreshTokenResponse = async (req, res) => {
  try {
    const email = req.user?.v_email;
    if (!email) return;

    // Fetch fresh user data from database (including new vendor_mode)
    const user = await findUserByEmail(email);
    if (!user) return;

    // Generate new tokens with updated payload
    const { accessToken, refreshToken } = generateAuthTokens(user);

    const isProd = process.env.NODE_ENV === "production";
    
    // Set updated cookies
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

    // Attach updated user to request for immediate use in following middleware/controllers
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    return decoded;

  } catch (error) {
    console.error("Token Refresh Utility Error:", error);
  }
};
