import axios from "axios";
import sequelize from "../../db/connection.js";
import { QueryTypes, fn, col, literal } from "sequelize";
import VendorWebhookAuth from "../../models/vendorWebhookAuth.model.js";
import VendorsLeads from "../../models/vendorLead.model.js";
import VendorLeadsTeam from "../../models/vendorLeadsTeam.model.js";
import VendorAgentRemarkReminder from "../../models/vendorAgentRemarkReminder.model.js";
import EmailQueue from "../../models/emailQueue.model.js";
import VendorAuth from "../../models/vendorAuth.model.js";
import VendorDetails from "../../models/vendorDetail.model.js";
import VendorTeams from "../../models/vendorTeams.model.js";
import VendorUserTeam from "../../models/vendorUserTeam.model.js";
import { AppError } from "../../utilis/appError.js";

// Define Associations needed for planSubscribeRequestService
VendorAuth.hasOne(VendorDetails, {
  foreignKey: "vendor_id",
  sourceKey: "vendor_id",
});

VendorsLeads.hasOne(VendorLeadsTeam, {
  foreignKey: "lead_id",
  sourceKey: "lead_id",
});

VendorUserTeam.belongsTo(VendorTeams, { foreignKey: "team_id" });
VendorUserTeam.hasMany(VendorLeadsTeam, { foreignKey: "adSales_AM", sourceKey: "user_id" });

const mapCredentialsToColumns = (auth_type, credentials = {}) => {
  switch (auth_type) {
    case "Basic Auth":
      return {
        client_id: credentials.username || "",
        client_secret: credentials.password || "",
        send_basic_auth: 1,
      };
    case "API Key":
      return {
        client_id: "api_key",
        client_secret: credentials.api_key || "",
        send_basic_auth: 0,
      };
    case "Bearer Token":
      return {
        client_id: "bearer",
        client_secret: credentials.bearer_token || "",
        send_basic_auth: 0,
      };
    case "OAuth 2.0":
      return {
        client_id: credentials.client_id || "",
        client_secret: credentials.client_secret || "",
        send_basic_auth: 0,
      };
    default:
      return { client_id: "", client_secret: "", send_basic_auth: 0 };
  }
};

const valiDateCredentials = (auth_type, credColumns) => {
  if (!credColumns.client_secret) {
    throw new Error("Authentication credentials are required");
  }
  if (auth_type === "Basic Auth" && !credColumns.client_id) {
    throw new Error("Username is required for Basic Auth");
  }
};

const VALID_API_PLAN_IDS = []; // Manually add valid plan IDs here

const checkIfVendorHasApiPlan = async (vendor_id) => {
  const query = `
    SELECT opd.lead_plan_id, tlp.deliverables
    FROM oms_pi_details opd
    INNER JOIN tbl_leads_plan tlp ON tlp.id = opd.lead_plan_id
    WHERE opd.vendor_id = :vendor_id AND opd.pi_status = 3
  `;

  const results = await sequelize.query(query, {
    replacements: { vendor_id },
    type: QueryTypes.SELECT,
  });

  // Check if any of the active plans are in the manual array or have 'api' in deliverables
  for (const row of results) {
    if (VALID_API_PLAN_IDS.includes(row.lead_plan_id)) {
      return true;
    }

    if (row.deliverables) {
      const deliverables = row.deliverables.toLowerCase();
      if (deliverables.includes("api integration") || deliverables.includes("api")) {
        return true;
      }
    }
  }

  return false;
};

export const handleCreateWebhook = async ({
  vendor_id,
  webhook_url,
  auth_type,
  credentials,
  fields,
}) => {
  if (!webhook_url || !auth_type) {
    throw new Error("webhook_url and auth_type are required");
  }
  const credColumns = mapCredentialsToColumns(auth_type, credentials);

  valiDateCredentials(auth_type, credColumns);

  // 1. ENFORCE TEST BEFORE ACTIVATE & CONFIG UPDATES
  // The vendor must have a successfully tested config in the DB matching exactly what they are trying to save.
  const existing = await VendorWebhookAuth.findOne({ where: { vendor_id } });

  if (
    !existing ||
    existing.request_url !== webhook_url ||
    existing.auth !== auth_type ||
    existing.client_id !== credColumns.client_id ||
    existing.client_secret !== credColumns.client_secret
  ) {
    throw new Error("Configuration mismatch or untested. Please click 'Test Connection' successfully before activating.");
  }

  // 2. Check if vendor has a valid plan to set status to 1
  const isValidPlan = await checkIfVendorHasApiPlan(vendor_id);
  const status = isValidPlan ? 1 : 0;

  // 3. Block request if vendor already submitted one in the last 2 days
  let already_requested = false;
  if (!isValidPlan) {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const recentOpportunity = await sequelize.query(`
      SELECT item_id 
      FROM vendor_agent_remark_reminder 
      WHERE value LIKE '%API Integration Request%' 
      AND created_at >= :twoDaysAgo 
      AND item_id IN (SELECT lead_id FROM vendors_leads WHERE vendor_id = :vendor_id)
      LIMIT 1
    `, {
      replacements: { twoDaysAgo, vendor_id },
      type: QueryTypes.SELECT
    });

    if (recentOpportunity.length > 0) {
      already_requested = true;
    }
  }

  const payload = {
    vendor_id,
    ...credColumns,
    auth: auth_type,
    headers: JSON.stringify(["Content-Type: application/json"]),
    request_url: webhook_url,
    http_action: "POST",
    format: JSON.stringify(Array.isArray(fields) ? fields : []),
    default_format: 1,
    status: status,
  };

  let responseData;
  if (existing) {
    responseData = await existing.update(payload);
  } else {
    responseData = await VendorWebhookAuth.create(payload);
  }

  return {
    webhook_url: responseData.request_url,
    auth_type: responseData.auth,
    status: responseData.status,
    already_requested,
  };
};

export const handleverifyWebhook = async ({ vendor_id, webhook_url, auth_type, credentials, fields }) => {
  if (!webhook_url) {
    throw new Error("webhook_url is required");
  }

  try {
    const response = await axios.get(webhook_url, {
      timeout: 10000,
      validateStatus: () => true,
    });

    const isOk = response.status >= 200 && response.status < 300;

    // Save the user data with status 0 on "Test Connection" only if successful
    if (isOk && auth_type && vendor_id) {
      const credColumns = mapCredentialsToColumns(auth_type, credentials);
      const payload = {
        vendor_id,
        ...credColumns,
        auth: auth_type,
        headers: JSON.stringify(["Content-Type: application/json"]),
        request_url: webhook_url,
        http_action: "POST",
        format: JSON.stringify(Array.isArray(fields) ? fields : []),
        default_format: 1,
        status: 0,
      };

      const existing = await VendorWebhookAuth.findOne({ where: { vendor_id } });
      if (existing) {
        await existing.update(payload);
      } else {
        await VendorWebhookAuth.create(payload);
      }
    }

    return {
      ok: isOk,
      status_code: response.status,
      message: isOk
        ? "Webhook URL is reachable"
        : `Webhook URL responded with HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      status_code: 0,
      message: "Webhook URL unreachable",
      error:
        error.code === "ECONNABORTED"
          ? "Request timed out"
          : error.code === "ENOTFOUND"
            ? "Could not resolve hostname"
            : error.code === "ECONNREFUSED"
              ? "Connection refused"
              : error.message,
    };
  }
};


export const planSubscribeRequestService = async (authData, postData) => {
  const transaction = await sequelize.transaction();
  try {
    const { profile_id, vendor_id } = authData;
    const { plan_name, reminder_date, hour, minute, message } = postData;

    // 0. Prevent duplicate requests within 2 days
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const recentOpportunity = await sequelize.query(`
      SELECT item_id 
      FROM vendor_agent_remark_reminder 
      WHERE value LIKE '%API Integration Request%' 
      AND created_at >= :twoDaysAgo 
      AND item_id IN (SELECT lead_id FROM vendors_leads WHERE vendor_id = :vendor_id)
      LIMIT 1
    `, {
      replacements: { twoDaysAgo, vendor_id },
      type: QueryTypes.SELECT
    });

    if (recentOpportunity.length > 0) {
      throw new AppError("You have already submitted a request recently. Our team will contact you soon.", 400);
    }

    // 1. Fetch Vendor Data via ORM
    const vendorData = await VendorAuth.findOne({
      where: { id: profile_id },
      include: [
        {
          model: VendorDetails,
          attributes: ["company"],
          where: { vendor_id: vendor_id },
          required: false,
        },
      ],
    });

    if (!vendorData) {
      throw new AppError("Vendor not found.", 404);
    }

    const reminder_datetime = `${reminder_date} ${hour}:${minute}:00`;
    const actual_plan_name = plan_name || "API Integration Request";

    let notes = `Vendor Remark:<br /> Plan name: ${actual_plan_name} <br /> Selected Date and Time by User: ${reminder_datetime} <br /> Message: ${message || ""} <br /> Note:this lead is been generated from the  e-seller panel.`;

    // 2. Determine Account Manager (adSales_AM)
    // First, check if a lead already exists for this vendor to reuse the AM organically
    const existingLead = await VendorsLeads.findOne({
      where: { vendor_id: vendor_id },
      include: [
        {
          model: VendorLeadsTeam,
          attributes: ["adSales_AM"],
          required: true,
        },
      ],
      order: [["lead_id", "DESC"]],
    });

    let manager_id_to_be_assigned = existingLead?.VendorLeadsTeam?.adSales_AM;

    if (!manager_id_to_be_assigned) {
      // Round Robin assignment from "Ad Sales" team via ORM aggregation
      const managers = await VendorUserTeam.findAll({
        attributes: ["user_id", [fn("COUNT", col("VendorLeadsTeams.id")), "total_leads"]],
        include: [
          {
            model: VendorTeams,
            where: { team_name: "Ad Sales" },
            attributes: [],
          },
          {
            model: VendorLeadsTeam,
            attributes: [],
            required: false, // LEFT JOIN to include managers with 0 leads
          },
        ],
        group: ["VendorUserTeam.user_id"],
        order: [[literal("total_leads"), "ASC"]],
        limit: 1,
        subQuery: false,
        raw: true,
      });

      if (managers.length > 0) {
        manager_id_to_be_assigned = managers[0].user_id;
      } else {
        manager_id_to_be_assigned = 0; // Fallback
      }
    }

    // 3. Insert New Lead in vendors_leads table via ORM
    const newLead = await VendorsLeads.create(
      {
        vendor_id: vendor_id,
        first_name: vendorData.first_name,
        last_name: vendorData.last_name,
        company: vendorData.VendorDetail?.company || "",
        email: vendorData.email,
        dial_code: vendorData.dial_code || "",
        phone: vendorData.phone || "",
        created_at: new Date(),
        creation_source: 4,
      },
      { transaction }
    );

    const lead_id = newLead.lead_id;

    // 4. Link Lead and Manager via ORM
    await VendorLeadsTeam.create(
      {
        lead_id: lead_id,
        adSales_AM: manager_id_to_be_assigned,
      },
      { transaction }
    );

    // 5. Insert Remark/Reminder via ORM mapping
    await VendorAgentRemarkReminder.create(
      {
        item_type: 3,
        item_id: lead_id,
        agent_id: manager_id_to_be_assigned,
        value: notes,
        type: 2,
        created_at: new Date(),
        reminder_time: reminder_datetime,
      },
      { transaction }
    );

    // 6. Queue Email Notification natively
    const emailBody = `
      <h3>New API Integration Plan Request</h3>
      <p><strong>Name:</strong> ${vendorData.first_name} ${vendorData.last_name}</p>
      <p><strong>Email:</strong> ${vendorData.email}</p>
      <p><strong>Contact:</strong> ${vendorData.phone}</p>
      <p><strong>Plan Name:</strong> ${actual_plan_name}</p>
      <p><strong>Message:</strong> ${message || ""}</p>
      <p><strong>Preferred Callback Time:</strong> ${reminder_date} ${hour}:${minute}</p>
    `;

    await EmailQueue.create(
      {
        to: process.env.REQUEST_CALLBACK_TO_MANAGER_IDS || "support@techjockey.com",
        cc: process.env.REQUEST_CALLBACK_CC_MANAGER_IDS || "",
        subject: "New Paid Plan Request - API Integration",
        body: emailBody,
        type: "plan_subscribe_request",
        app: "eseller",
        priority: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction }
    );

    await transaction.commit();
    return {
      message: "API Integration Request Sent Successfully",
    };
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};
