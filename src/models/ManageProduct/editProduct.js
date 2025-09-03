import sequelize from "../../db/connection.js";
import { QueryTypes } from "sequelize";

// Check if product belongs to vendor (by brand_arr)
export const isVendorProduc = async (productId, brandArr) => {
  const sql = `
    SELECT COUNT(*) AS count
    FROM tbl_product
    WHERE product_id = :productId
      AND brand_id IN (:brandArr)
  `;

  const result = await sequelize.query(sql, {
    replacements: { productId, brandArr },
    type: QueryTypes.SELECT,
  });

  return result[0].count > 0; // true/false
};
