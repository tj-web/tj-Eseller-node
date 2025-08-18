import sequelize from "../../db/connection.js";

export const addRemarkReminderUtil = async (data) => {
  try {
    // Fetch lead info
    const [leadInfo] = await sequelize.query(
      `SELECT customer_id AS user_id, name, email, phone, dial_code, product_id, 
              acd_uuid, vendor_id, created_at, company_id
       FROM tbl_leads
       WHERE id = ? LIMIT 1`,
      { replacements: [data.lead_id], type: sequelize.QueryTypes.SELECT }
    );

    if (!leadInfo) {
      return {
        status: false,
        message: "Lead not found"
      };
    }

    // Save lead history
    await sequelize.query(
      `INSERT INTO tbl_leads_history (lead_id, acd_uuid, type, additional_info, remark)
       VALUES (?, ?, ?, ?, ?)`,
      {
        replacements: [
          data.lead_id,
          leadInfo.acd_uuid,
          "remark",
          null,
          data.remark
        ]
      }
    );

    return {
      status: true,
      message: "Remark added successfully."
    };

  } catch (error) {
    return {
      status: false,
      message: error.message
    };
  }
};
