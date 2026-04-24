import jwt from "jsonwebtoken";
import LoginHistory from "../models/loginHistory.model.js";
import { findUserByEmail } from "../modules/common/service/userService.js";
import { generateAuthTokens } from "../modules/auth/auth.service.js";
if (!process.env.ACCESS_TOKEN_SECRET) {
  throw new Error("Missing ACCESS_TOKEN_SECRET");
}
if (!process.env.REFRESH_TOKEN_SECRET) {
  throw new Error("Missing REFRESH_TOKEN_SECRET");
}

// In-memory cache to rescue simultaneous request race-conditions during token rotation.
// Maps oldRefreshToken -> { accessToken, refreshToken, timestamp }
const refreshCache = new Map();

export const authenticate = async (req, res, next) => {
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;

  if (!accessToken && !refreshToken) {
    return res.status(401).json({ message: "Session expired. Please login again." });
  }

  // Helper to attach cookies
  const attachCookies = (newAccessToken, newRefreshToken) => {
    const isProd = process.env.NODE_ENV === "production"
    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 10 * 24 * 60 * 60 * 1000,
    });
  };

  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      req.user = decoded;
      return next();
    } catch (error) {

    }
  }

  if (!refreshToken) {
    return res.status(401).json({ message: "Token expired and no refresh token provided" });
  }

  try {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Token expired and no refresh token provided" });
  }

  // RACE CONDITION HANDLER:
  // If multiple concurrent requests hit this logic within seconds of each other,
  // the first one updates the DB. The subsequent ones will read the exact same
  // old refresh token, but it will no longer be valid in the DB!
  if (refreshCache.has(refreshToken)) {
    const cached = refreshCache.get(refreshToken);
    // Ensure cache is not older than 15 seconds
    if (Date.now() - cached.timestamp < 15000) {
      req.user = jwt.verify(cached.accessToken, process.env.ACCESS_TOKEN_SECRET);
      attachCookies(cached.accessToken, cached.refreshToken);
      return next();
    }
  }

  try {
    const record = await LoginHistory.findOne({
      where: { auth_token: refreshToken, login_status: 1 },
    });

    if (!record) {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }

    const user = await findUserByEmail(record.email_id);
    if (!user || user.Vendor?.status === 0) {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }

    // Generate new tokens (Rotation)
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateAuthTokens(user);

    // Update DB Atomically
    await LoginHistory.update(
      { auth_token: newRefreshToken, login_status: 1 },
      { where: { id: record.id } }
    );

    // Save to our short-lived cache to rescue incoming concurrent requests
    refreshCache.set(refreshToken, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      timestamp: Date.now(),
    });

    // Cleanup cache after 15 seconds
    setTimeout(() => {
      refreshCache.delete(refreshToken);
    }, 15000);

    const decoded = jwt.verify(newAccessToken, process.env.ACCESS_TOKEN_SECRET);

    req.user = decoded;
    attachCookies(newAccessToken, newRefreshToken);

    next();
  } catch (err) {
    console.error("Auth Middleware Refresh Error:", err);
    return res.status(401).json({ message: "Invalid session." });
  }
};