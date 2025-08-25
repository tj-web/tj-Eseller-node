import sequelize from "../../db/connection.js";
import { QueryTypes } from "sequelize";

export const saveOrUpdateProductFeature = async (post) => {
  try {
    // Build save object
    const save = {
      section_id: post.section_id || null,
      description: post.description || "",
      feature_display_name: post.feature_display_name || "",
      product_id: post.product_id,
      type: post.type || 0,
      image: post.image || null,
      created_at: post.created_at || new Date()
    };

    if (post.update_id) {
      // 🔹 UPDATE query
      const setClause = Object.keys(save)
        .map((key) => `${key} = :${key}`)
        .join(", ");

      const query = `
        UPDATE tbl_product_features 
        SET ${setClause} 
        WHERE id = :update_id
      `;

      await sequelize.query(query, {
        replacements: { ...save, update_id: post.update_id },
        type: QueryTypes.UPDATE,
      });

      return { action: "update", id: post.update_id };
    } else {
      // 🔹 INSERT query
      const keys = Object.keys(save).join(", ");
      const values = Object.keys(save).map((key) => `:${key}`).join(", ");

      const query = `
        INSERT INTO tbl_product_features (${keys}) 
        VALUES (${values})
      `;

      const [result] = await sequelize.query(query, {
        replacements: save,
        type: QueryTypes.INSERT,
      });

      return { action: "insert", id: result }; // MySQL: result = insertId
    }
  } catch (error) {
    console.error("Error in saveOrUpdateProductFeature (model):", error);
    throw error;
  }
};
