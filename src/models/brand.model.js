import { Sequelize } from "sequelize";
import sequelize from "../db/connection.js";
export async function get_vendor_brands({
  vendor_id,
  orderby,
  order,
  srch_brand_name,
  srch_status,
  limit = 10,
  pagenumber = 1,
}) {
  let whereCondition = "";
  let offset = (pagenumber - 1) * limit;
  // whereCondition = `vbr.vendor_id = ${vendor_id} AND vbr.tbl_brand_id != 0`;
  switch (orderby) {
    case "s_id":
      orderby = "tb.id";

      break;
    case "s_brand_name":
      orderby = "tb.brand_name";

      break;
    case "s_status":
      orderby = "vbr.status";

      break;
    default:
      orderby = "tb.brand_id";
  }

  order = order || "desc";
  whereCondition = `vbr.vendor_id = :vendor_id AND vbr.tbl_brand_id != 0`;

  if (srch_brand_name)
    whereCondition += ` AND tb.brand_name LIKE :srch_brand_name`;

  if (srch_status) whereCondition += ` AND vbr.status = :srch_status`;

  const sql = `SELECT
    vbr.id,
    vbr.vendor_id,
    vbr.tbl_brand_id,
    vbr.status,
    tb.brand_name,
    tb.description,
    tb.image,
    tb.status AS brand_status
FROM
    vendor_brand_relation AS vbr
LEFT JOIN tbl_brand AS tb
ON
    tb.brand_id = vbr.tbl_brand_id
WHERE
    ${whereCondition}
ORDER BY :orderby :order

LIMIT :offset, :limit;`;

  const results = await sequelize.query(sql, {
    replacements: {
      vendor_id,
      limit: +limit,
      offset,
      orderby,
      order,
      srch_brand_name,
      srch_status,
    },
    type: sequelize.QueryTypes.SELECT,
  });

  return results;
}

/****************************get brands details*************************************/

export const get_brand_by_id = async (vendor_id, brand_id) => {
  const query = `
    SELECT 
      b.brand_name,
      b.description,
      b.image,
      b.status,
      tbi.id AS tbl_info_id,
      tbi.information,
      tbi.founded_on,
      tbi.founders,
      tbi.company_size,
      tbi.location,
      tbi.industry
    FROM tbl_brand AS b
    INNER JOIN vendor_brand_relation AS vbr
      ON vbr.tbl_brand_id = b.brand_id
    LEFT JOIN tbl_brand_info AS tbi
      ON tbi.tbl_brand_id = b.brand_id
    WHERE b.brand_id = :brand_id
      AND vbr.vendor_id = :vendor_id
    LIMIT 1
  `;

  const [results] = await sequelize.query(query, {
    replacements: { brand_id, vendor_id },
    type: sequelize.QueryTypes.SELECT,
  });

  return results || null;
};
/************************CHECK BRAND METHOD*************************/

export const checkBrandName = async (brand_name, brand_id) => {
  try {
    let query = `
      SELECT * 
      FROM tbl_brand 
      WHERE is_deleted = 0 
        AND brand_name = :brand_name
    `;

    if (brand_id) {
      query += " AND brand_id != :brand_id";
    }

    // Use array destructuring properly
    const [results] = await sequelize.query(query, {
      replacements: { brand_name, brand_id },
      type: sequelize.QueryTypes.SELECT,
    });

    // `results` itself is already the array of rows
    return results == undefined ? true : false;
  } catch (error) {
    console.error("Error in checkBrandName:", error);
    throw error;
  }
};



export async function saveBrand(save, brand_id = "") {
  try {

    if (brand_id) {
      // ✅ Update existing brand
      const setClause = Object.keys(save)
        .map((key) => `${key} = :${key}`)
        .join(", ");

      await sequelize.query(
        `UPDATE tbl_brand 
         SET ${setClause} 
         WHERE id = :brand_id`,
        {
          replacements: { ...save, brand_id },
          type: sequelize.QueryTypes.UPDATE,
        }
      );

      return brand_id;
    } else {
      // ✅ Insert new brand
      const keys = Object.keys(save).join(", ");
      const values = Object.keys(save)
        .map((key) => `:${key}`)
        .join(", ");

      const [result] = await sequelize.query(
        `INSERT INTO tbl_brand (${keys}) VALUES (${values})`,
        {
          replacements: save,
          type: sequelize.QueryTypes.INSERT,
        }
      );

      // MySQL returns [insertId, affectedRows]
      return result;
    }
  } catch (error) {
    console.error("Error in saveBrand:", error);
    return null;
  }
}
