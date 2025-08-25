import sequelize from "../../db/connection.js";

// Check if vendor owns product
export const isVendorProduct = async (product_id, brand_arr) => {
  const query = `
    SELECT COUNT(*) as count 
    FROM tbl_product 
    WHERE product_id = :product_id 
    AND brand_id IN (:brand_arr)
  `;

  const result = await sequelize.query(query, {
    replacements: { product_id, brand_arr },
    type: sequelize.QueryTypes.SELECT,
  });

  return result[0].count > 0; // returns true/false
};

// Fetch all features for product
export const getAllFeatures = async (product_id) => {
  const query = `
    SELECT * 
    FROM tbl_product_features 
    WHERE product_id = :product_id
  `;

  const result = await sequelize.query(query, {
    replacements: { product_id },
    type: sequelize.QueryTypes.SELECT,
  });

  return result;
};
