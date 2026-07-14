import EmailQueue from "../../../models/emailQueue.model.js";
import crypto from "crypto";
import Vendor from "../../../models/vendor.model.js";
import VendorAuth from "../../../models/vendorAuth.model.js";
import sequelize from "../../../db/connection.js";
import { AppError } from "../../../utilis/appError.js";
import { renderTemplate } from "../../../helpers/emailHelper.js";
import { produceToQueue } from "../../../config/rabbitmq.producer.js";
import { EMAIL_DLQ_NAME, EMAIL_QUEUE_PRIORITY, generateMessageId } from "../../../config/constants.js";


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

  await EmailQueue.create(
    {
      to: email,
      cc: "support@techjockey.com",
      subject: "Verify your email",
      body,
      type: "email_verification",
      app: "eseller",
      table_column: "vendor_id",
      column_value: vendorId,
      created_at: new Date(),
      updated_at: new Date(),
    },
    { transaction },
  );

  await produceToQueue(
    EMAIL_QUEUE_PRIORITY.NORMAL.routingKey,
    {
      messageId: generateMessageId(),
      source: "techjockey",
      priority: EMAIL_QUEUE_PRIORITY.NORMAL.priority,
      rawHtml: body,
      subject: "Verify your email",
      email_type: "email_verification",
      recipient: {
        to: email,
        cc: "support@techjockey.com",
      },
      sender: {
        name: "Techjockey",
        email: process.env.NOREPLY_EMAIL,
        replyTo: process.env.NOREPLY_EMAIL,
      },
    },
    EMAIL_DLQ_NAME
  );
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

  await EmailQueue.create(
    {
      to: process.env.ADMIN_EMAIL,
      subject: "Vendor Registration",
      body,
      type: "admin_verification",
      app: "eseller",
      table_column: "vendor_id",
      column_value: vendorId,
      created_at: new Date(),
      updated_at: new Date(),
    },
    { transaction },
  );

  await produceToQueue(
    EMAIL_QUEUE_PRIORITY.NORMAL.routingKey,
    {
      messageId: generateMessageId(),
      source: "techjockey",
      priority: EMAIL_QUEUE_PRIORITY.NORMAL.priority,
      rawHtml: body,
      subject: "Vendor Registration",
      email_type: "admin_verification",
      recipient: {
        to: process.env.ADMIN_EMAIL,
      },
      sender: {
        name: "Techjockey",
        email: process.env.NOREPLY_EMAIL,
        replyTo: process.env.NOREPLY_EMAIL,
      },
    },
    EMAIL_DLQ_NAME
  );
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
    await EmailQueue.create(
      {
        to,
        cc,
        subject,
        body,
        type,
        app,
        table_column,
        column_value,
        created_at: new Date(),
        updated_at: new Date(),
      },
      transaction ? { transaction } : {}
    );

    await produceToQueue(
      EMAIL_QUEUE_PRIORITY.NORMAL.routingKey,
      {
        messageId: generateMessageId(),
        source: "techjockey",
        priority: EMAIL_QUEUE_PRIORITY.NORMAL.priority,
        rawHtml: body,
        subject,
        email_type: type,
        recipient: {
          to,
          cc,
        },
        sender: {
          name: "Techjockey",
          email: process.env.NOREPLY_EMAIL,
          replyTo: process.env.NOREPLY_EMAIL,
        },
      },
      EMAIL_DLQ_NAME
    );
    

    return true;
  } catch (error) {
    console.error("Error queueing email:", error);
    throw error;
  }
};
