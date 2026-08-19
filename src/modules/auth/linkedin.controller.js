import crypto from "crypto";
import { findUserByEmail } from "../common/service/userService.js";
import { generateAuthTokens, createLoginHistory } from "./auth.service.js";
import {
  linkedinAccessToken,
  linkedinProfileInfo,
  customerSocialLogin,
} from "./linkedin.service.js";
import { AppError } from "../../utilis/appError.js";
import { LINKEDIN_CONFIG } from "../../config/linkedin.config.js";

export const linkedinInitiate = (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("li_oauth_state", state, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 5 * 60 * 1000,
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: LINKEDIN_CONFIG.clientId,
    redirect_uri: LINKEDIN_CONFIG.callbackUrl,
    state,
    scope: LINKEDIN_CONFIG.scope,
  });

  return res.redirect(`${LINKEDIN_CONFIG.authUrl}?${params.toString()}`);
};

export const linkedinCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const cookieState = req.cookies?.li_oauth_state;
    res.clearCookie("li_oauth_state");

    if (!code) {
      throw new AppError("Invalid Authorization Token. Please try again.", 400);
    }

    if (!state || state !== cookieState) {
      throw new AppError("CSRF Token Mismatch. Please try again.", 400);
    }

    const accessToken = await linkedinAccessToken(code);

    const basicInfo = await linkedinProfileInfo(accessToken, "profile");
    const email = await linkedinProfileInfo(accessToken, "email");

    const profile = {
      linkedin_id: basicInfo.id,
      first_name: basicInfo.firstname,
      last_name: basicInfo.lastname,
      email,
    };

    await customerSocialLogin(profile);

    const user = await findUserByEmail(profile.email);

    if (!user) {
      throw new AppError("Invalid credentials", 400);
    }

    if (user.Vendor?.status === 0) {
      throw new AppError("Account disabled", 403);
    }

    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    const deviceId = req.headers["x-device-id"] || null;

    const { accessToken: jwtAccessToken, refreshToken } = generateAuthTokens(user);

    await createLoginHistory(user, ip, deviceId, refreshToken, "linkedin");

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("access_token", jwtAccessToken, {
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

    return res.redirect(LINKEDIN_CONFIG.successRedirect);
  } catch (error) {
    console.error("LinkedIn auth error:", error.message);
    return res.redirect(LINKEDIN_CONFIG.failureRedirect);
  }
};
