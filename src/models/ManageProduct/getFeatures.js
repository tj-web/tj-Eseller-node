import sequelize from "../../db/connection.js";
import ProductFeature from "../productFeature.js";
import Feature from "../features.js";

// Fetch all features for product
// export const getProductFeatures = async (product_id) => {
//   const query = `
//     SELECT * 
//     FROM tbl_product_features 
//     WHERE product_id = :product_id
//   `;

//   const result = await sequelize.query(query, {
//     replacements: { product_id },
//     type: sequelize.QueryTypes.SELECT,
//   });

//   return result;
// };

// Relationship: tbl_product_features.section_id -> tbl_feature.feature_id

ProductFeature.belongsTo(Feature, {
  as: "featureMaster",
  foreignKey: "section_id",
  targetKey: "feature_id",
});

export const getProductFeatures = async (product_id) => {
  try {
    const productFeatures = await ProductFeature.findAll({
      where: {
        product_id: product_id,
        is_deleted: 0 // Adding a safety check to only get active features
      },
      order: [['sort_order', 'ASC']] // Optional: ensures they appear in the right order
    });

    return productFeatures;
  } catch (error) {
    console.error("Error in getAllFeatures service:", error);
    throw error;
  }
};




/**
 * Fetches all available features for the vendor selection list.
 * Only returns active (non-deleted) features.
 */
export const getAllFeatures = async () => {
  try {
    const features = await Feature.findAll({
      attributes: ['feature_id', 'feature_name'],
      where: {
        status: 1,
        is_deleted: 0
      },
      order: [['feature_name', 'ASC']]
    });

    return features;
  } catch (error) {
    console.error("Error fetching feature list:", error);
    throw error;
  }
};