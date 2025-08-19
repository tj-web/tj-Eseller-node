import sequelize from "../../db/connection.js";
export const getLeadHistory = async (leadId) => {
  const query = `
    SELECT *
    FROM tbl_leads_history
    WHERE lead_id = :leadId
      AND (source != 'crm' OR source IS NULL)
    ORDER BY id DESC
  `;

  const results = await sequelize.query(query, {
    replacements: { leadId },
    type: sequelize.QueryTypes.SELECT
  });

  return results;
};