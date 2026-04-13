import sequelize from "../../db/connection.js";
import { Op, QueryTypes } from "sequelize";
import Product from "../product.js"; 

// Check if product belongs to vendor (by brand_arr)
// export const isVendorProduc = async (productId, brandArr) => {
//   const sql = `
//     SELECT COUNT(*) AS count
//     FROM tbl_product
//     WHERE product_id = :productId
//       AND brand_id IN (:brandArr)
//   `;

//   const result = await sequelize.query(sql, {
//     replacements: { productId, brandArr },
//     type: QueryTypes.SELECT,
//   });

//   return result[0].count > 0; // true/false
// };


export const isVendorProduct = async (productId, brandArr) => {
  try {
    const count = await Product.count({
      where: {
        product_id: productId,
        brand_id: {
          [Op.in]: brandArr
        }
      }
    });

    return count > 0; // Returns true if found, false otherwise
  } catch (error) {
    console.error("Error in isVendorProduct service:", error);
    throw error;
  }
};
