import { Sequelize } from "sequelize";
import sequelize from "../db/connection.js";
import { QueryTypes } from 'sequelize';

export const getOemPlansWithRawSQL = async (vendor_id) => {
  const query = `
    SELECT 
      opd.id, opd.brand_id, opd.vendor_id, opd.lead_plan_id, 
      opd.total_lead AS total_credits, opd.used_lead AS credits_used,
      opd.start_date, opd.end_date,
      tlp.plan_name, tlp.plan_type, tlp.show_credits,
      tlc.product_id, tp.product_name
    FROM oms_pi_details opd
    LEFT JOIN tbl_leads_plan tlp ON tlp.id = opd.lead_plan_id
    LEFT JOIN tbl_leads_counter tlc ON tlc.order_id = opd.id
    LEFT JOIN tbl_product tp ON tp.product_id = tlc.product_id
    WHERE opd.vendor_id = :vendor_id AND opd.pi_status = 3
    ORDER BY opd.id DESC
  `;

  const results = await sequelize.query(query, {
    replacements: { vendor_id },
    type: QueryTypes.SELECT,
  });

  return results;
};
