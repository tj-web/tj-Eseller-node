import sequelize from "../../db/connection.js";
import VendorsLeads from "../../models/vendorLead.model.js";
import VendorLeadsTeam from "../../models/vendorLeadsTeam.model.js";
import VendorAgentRemarkReminder from "../../models/vendorAgentRemarkReminder.model.js";
import EmailQueue from "../../models/emailQueue.model.js";
import VendorAuth from "../../models/vendorAuth.model.js";
import VendorDetails from "../../models/vendorDetail.model.js";
import VendorTeams from "../../models/vendorTeams.model.js";
import VendorUserTeam from "../../models/vendorUserTeam.model.js";
import { QueryTypes, fn, col, literal } from "sequelize";
import { AppError } from "../../utilis/appError.js";

// Define Associations
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

/* =========================================
   PLAN SUBSCRIBE REQUEST CORE LOGIC (Boost Sales)
========================================= */

export const planSubscribeRequestService = async (authData, postData) => {
  const transaction = await sequelize.transaction();
  try {
    const { profile_id, vendor_id } = authData;
    const { plan_name, budget, reminder_date, hour, minute } = postData;

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
    const actual_plan_name = plan_name || "Upgrade Now";
    
    // Replace Rupee symbol with space to avoid DB collation issues
    const sanitizedBudget = budget.replace(/₹/g, " ");

    const notes = `Vendor Remark:<br /> Plan name: ${actual_plan_name} <br /> Budget: ${sanitizedBudget} <br /> Selected Date and Time by User: ${reminder_datetime}`;

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
      <h3>New Paid Plan Request</h3>
      <p><strong>Name:</strong> ${vendorData.first_name} ${vendorData.last_name}</p>
      <p><strong>Email:</strong> ${vendorData.email}</p>
      <p><strong>Contact:</strong> ${vendorData.phone}</p>
      <p><strong>Plan Name:</strong> ${actual_plan_name}</p>
      <p><strong>Budget:</strong> ${sanitizedBudget}</p>
      <p><strong>Preferred Callback Time:</strong> ${reminder_date} ${hour}:${minute}</p>
    `;

    await EmailQueue.create(
      {
        to: process.env.REQUEST_CALLBACK_TO_MANAGER_IDS || "support@techjockey.com",
        cc: process.env.REQUEST_CALLBACK_CC_MANAGER_IDS || "",
        subject: "New Paid Plan Request",
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
      message: "Subscribe Request Sent Successfully",
    };
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};
