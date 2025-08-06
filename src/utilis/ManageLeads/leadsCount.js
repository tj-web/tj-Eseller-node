import sequelize from '../../db/connection.js';

export const getLeadsCount = async (vendor_id) => {
  const query = `
    SELECT COUNT(tl.id) AS total
    FROM tbl_leads AS tl
    WHERE tl.vendor_id = ?
      AND tl.phone <> ''
      AND tl.email <> ''
      AND (
            tl.lead_visibility = 1
            OR (tl.lead_visibility = 0 AND tl.is_trashed = 1)
          )
  `;

  const [rows] = await sequelize.query(query, {
    replacements: [vendor_id],
    type: sequelize.QueryTypes.SELECT,
  });

  return rows?.total || 0;
};
