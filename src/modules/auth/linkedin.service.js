import axios from "axios";
import sequelize from "../../db/connection.js";
import VendorAuth from "../../models/vendorAuth.model.js";
import Vendor from "../../models/vendor.model.js";
import { findUserByEmail, createVendor, createVendorAuth } from "../common/service/userService.js";
import { LINKEDIN_CONFIG } from "../../config/linkedin.config.js";
import { AppError } from "../../utilis/appError.js";

export const linkedinAccessToken = async (code) => {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: LINKEDIN_CONFIG.callbackUrl,
    client_id: LINKEDIN_CONFIG.clientId,
    client_secret: LINKEDIN_CONFIG.clientSecret,
  });

  const { data } = await axios.post(LINKEDIN_CONFIG.tokenUrl, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!data?.access_token) {
    throw new AppError("Failed to retrieve LinkedIn access token", 400);
  }

  return data.access_token;
};

export const linkedinProfileInfo = async (accessToken, type) => {
  const headers = { Authorization: `Bearer ${accessToken}` };

  if (type === "profile") {
    const { data } = await axios.get(LINKEDIN_CONFIG.profileUrl, { headers });
    return {
      id: data.id,
      firstname: data.localizedFirstName,
      lastname: data.localizedLastName,
    };
  }

  if (type === "email") {
    const { data } = await axios.get(LINKEDIN_CONFIG.emailUrl, { headers });
    const element = data?.elements?.[0];
    const email = element?.["handle~"]?.emailAddress;
    if (!email) {
      throw new AppError("Unable to fetch LinkedIn email", 400);
    }
    return email;
  }

  throw new AppError(`Unsupported LinkedIn profile info type: ${type}`, 400);
};

export const customerSocialLogin = async (profile) => {
  const { linkedin_id, first_name, last_name, email } = profile;

  if (!email) {
    throw new AppError("LinkedIn account has no email associated", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);

  if (existing) {
    if (linkedin_id && existing.linkedin_id !== linkedin_id) {
      const transaction = await sequelize.transaction();
      try {
        await VendorAuth.update(
          { linkedin_id },
          { where: { vendor_id: existing.vendor_id }, transaction }
        );
        await Vendor.update(
          { linkedin_id },
          { where: { id: existing.vendor_id }, transaction }
        );
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    return {
      vendor_id: existing.vendor_id,
      vendor_auth_id: existing.id,
    };
  }

  const transaction = await sequelize.transaction();
  try {
    const vendor = await createVendor(
      {
        first_name,
        last_name,
        email: normalizedEmail,
        linkedin_id,
        vendor_type: 1,
        signup_progress: 2,
        email_verified: 1,
        status: 1,
        admin_verified: 1,
        is_deleted: 0,
        is_temp: 1,
        registration_source: "1",
        creation_source: 1,
        created_at: new Date(),
      },
      transaction
    );

    const vendorAuth = await createVendorAuth(
      {
        vendor_id: vendor.id,
        first_name,
        last_name,
        email: normalizedEmail,
        linkedin_id,
        email_verified: 1,
        status: 1,
        is_deleted: 0,
        is_admin: 1,
        is_acd: 1,
        admin_verified: 1,
        sort_order: 0,
        created_at: new Date(),
      },
      transaction
    );

    await transaction.commit();

    return {
      vendor_id: vendor.id,
      vendor_auth_id: vendorAuth.id,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
