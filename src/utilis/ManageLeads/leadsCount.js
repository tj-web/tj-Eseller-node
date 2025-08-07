// import sequelize from '../../db/connection.js';

// export const getLeadsCount = async (vendor_id) => {
//   const query = `
//     SELECT COUNT(tl.id) AS total
//     FROM tbl_leads AS tl
//     WHERE tl.vendor_id = ?
//       AND tl.phone <> ''
//       AND tl.email <> ''
//       AND (
//             tl.lead_visibility = 1
//             OR (tl.lead_visibility = 0 AND tl.is_trashed = 1)
//           )
//   `;

//   const [rows] = await sequelize.query(query, {
//     replacements: [vendor_id],
//     type: sequelize.QueryTypes.SELECT,
//   });

//   return rows?.total || 0;
// };



import sequelize from '../../db/connection.js';

export const getLeadsCount = async (vendor_id) => {
  const query = `
    SELECT 
      tl.*,
      tls.status_name, 
      IF(tls.subaction_name IS NULL, tls.lead_action_name, tls.subaction_name) AS lead_action_name, 
      tl.created_at AS start_date, 
      tr.call_status, 
      tp.slug, tp.micro_transaction_model_price,
      (CASE WHEN tp.lead_model_type IN (1, 3, 4, 7) THEN 1 WHEN tl.dial_code != 91 THEN 1 ELSE 0 END) AS show_contact_cta, 
      (CASE WHEN tp.lead_model_type IN (4, 7) THEN 1 ELSE 0 END) AS show_upgrade_cta 
    FROM (
      SELECT 
        tl.id, 
        tl.email AS customer_email,
        tl.original_parent_id, 
        tl.parent_id, 
        tl.dial_code, 
        IF(tl.dial_code != 91, '1', '0') AS is_international,
        tl.city, 
        tl.state,
        tl.lead_model_type,
        tl.credit_used,
        tl.show_credits,
        tl.vendor_id,
        tl.is_acd, 
        IF(tl.dial_code != 91, '1', tl.is_show_contact) AS is_show_contact,
        IF(tl.dial_code != 91, tl.phone, IF(tl.is_show_contact, tl.phone, '')) AS show_contact_phone,
        tl.is_lead_cta, 
        tl.is_communication, 
        tl.is_contact_viewed, 
        IF(tl.is_contact_viewed > 0, CONCAT(tl.email, ' | ', tl.phone), NULL) AS contact_info, 
        IF(tl.is_contact_viewed > 0, tl.email, NULL) AS lead_email, 
        IF(tl.is_contact_viewed > 0, tl.phone, NULL) AS lead_phone,
        tl.acd_uuid, 
        tl.name, 
        tl.customer_id, 
        tl.company_id,
        tl.product_id, 
        IF(tl.parent_id IS NULL, tl.product_name, tl.software_category) AS product_name, 
        tl.brand_id, 
        IF(tl.lead_type = 'DEMO', 'DEMO', 'CALL') AS lead_type, 
        tl.lead_visibility, 
        tl.status, 
        tl.lead_action, 
        tl.created_at, 
        tl.is_trashed, 
        tl.is_duplicate, 
        tl.user_intent 
      FROM tbl_leads AS tl 
      WHERE tl.vendor_id = ?
        AND tl.phone <> ''
        AND tl.email <> ''
      ORDER BY tl.id DESC
      LIMIT 10 OFFSET 0
    ) AS tl
    LEFT JOIN tbl_request_callbacks tr ON tr.acd_uuid = tl.acd_uuid
    LEFT JOIN tbl_product tp ON tp.product_id = tl.product_id
    LEFT JOIN tbl_leads_status tls ON tls.id = tl.lead_action
    ORDER BY tl.id DESC
  `;

  const result = await sequelize.query(query, {
    replacements: [vendor_id],
    type: sequelize.QueryTypes.SELECT
  });

  return result;
};
