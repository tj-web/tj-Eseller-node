import crypto from "crypto";
import Vendor from "../../../models/vendor.model.js";
import VendorAuth from "../../../models/vendorAuth.model.js";
import sequelize from "../../../db/connection.js";
import { AppError } from "../../../utilis/appError.js";
import { renderTemplate } from "../../../helpers/emailHelper.js";
import { publishEmailToQueue } from "../../../config/rabbitmq.producer.js";


export const sendVerificationEmail = async (
  email,
  token,
  vendorId,
  transaction,
) => {
  const link = `${process.env.HTTP_SCHEME}://${process.env.APP_URL}/V6/auth/verify-email?token=${token}`;

  const mainsiteUrl = process.env.MAINSITE_URL || "https://www.techjockey.com/";
  const assetUrl = `${mainsiteUrl}assets/images/`;
  const tjassetUrl = `${mainsiteUrl}assets/nw-wb/emailer_img/`;

  const body = await renderTemplate("verify-email", {
    assetUrl,
    mainsiteUrl,
    tjassetUrl,
    verifyLink: link
  });

  await publishEmailToQueue({
    rawHtml: body,
    subject: "Verify your email",
    emailType: "email_verification",
    to: email,
    cc: "support@techjockey.com",
  });
};

export const sendAdminNotification = async (
  first_name,
  last_name,
  email,
  dial_code,
  phone,
  vendorId,
  transaction,
) => {
  const body = await renderTemplate("admin-approval-request", {
    vendorId,
    first_name,
    last_name,
    email,
    contact_number: `${dial_code} ${phone}`
  });

  await publishEmailToQueue({
    rawHtml: body,
    subject: "Vendor Registration",
    emailType: "admin_verification",
    to: process.env.ADMIN_EMAIL,
  });
};

export const verifyEmailService = async (token) => {
  if (!token) {
    throw new AppError("Token missing", 400);
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const transaction = await sequelize.transaction();

  try {
    const user = await Vendor.findOne({
      where: { hash_string: hashedToken },
    });

    if (!user) {
      throw new AppError("Invalid or expired link", 400);
    }

    await Vendor.update(
      {
        email_verified: 1,
      },
      {
        where: { id: user.id },
        transaction,
      },
    );

    await VendorAuth.update(
      {
        email_verified: 1,
      },
      {
        where: { vendor_id: user.id },
        transaction,
      },
    );

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};


// ***************************************************** will just send a email :)


export const queueEmail = async ({
  to,
  cc = null,
  subject,
  body,
  type = "general",
  app = "eseller",
  table_column = null,
  column_value = null,
  transaction = null,
}) => {
  try {
    await publishEmailToQueue({
      rawHtml: body,
      subject,
      emailType: type,
      to,
      cc,
    });

    return true;
  } catch (error) {
    console.error("Error queueing email:", error);
    throw error;
  }
};
