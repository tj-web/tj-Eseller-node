import { Sequelize } from "sequelize";
import sequelize from "../db/connection.js";

export const oemTotalLeadsCountInfo = async ({
  filter_start_date,
  filter_end_date,
  vendor_id,
}) => {
  try {
    const params = [vendor_id];
    let query = `
      SELECT 
        COUNT(1) AS total_leads,
        SUM(CASE WHEN (status != '2' AND is_contact_viewed = '0') THEN 1 ELSE 0 END) AS pending_leads,
        SUM(CASE WHEN (status = '2' OR is_contact_viewed = '1') THEN 1 ELSE 0 END) AS utilised_leads
      FROM tbl_leads
      WHERE vendor_id = ?
        AND phone <> ''
        AND email <> ''
        AND (lead_visibility = 1 OR (lead_visibility = 0 AND is_trashed = 1))
    `;

    if (filter_start_date && filter_end_date) {
      query += ` AND created_at BETWEEN ? AND ?`;
      params.push(filter_start_date, filter_end_date);
    }

    const [result] = await sequelize.query(query, {
      replacements: params,
      type: Sequelize.QueryTypes.SELECT,
    });

    return result;
  } catch (err) {
    throw err;
  }
};
