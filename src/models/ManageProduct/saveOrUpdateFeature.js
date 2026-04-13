import ProductFeature from "../productFeature.js";

// export const saveOrUpdateProductFeature = async (id, post) => {
//   try {
//     // Build save object
//     const save = {
//       section_id: post.section_id || null,
//       description: post.description || "",
//       feature_display_name: post.feature_display_name || "",
//       product_id: post.product_id,
//       type: post.type || 0,
//       image: post.image || '',
//       created_at: post.created_at || new Date()
//     };

//     if (id) {
//       // 🔹 UPDATE query
//       const setClause = Object.keys(save)
//         .map((key) => `${key} = :${key}`)
//         .join(", ");

//       const query = `
//         UPDATE tbl_product_features 
//         SET ${setClause} 
//         WHERE id = :id
//       `;

//       await sequelize.query(query, {
//         replacements: { ...save, id },
//         type: QueryTypes.UPDATE,
//       });

//       return { action: "update", id };
//     } else {
//       // 🔹 INSERT query
//       const keys = Object.keys(save).join(", ");
//       const values = Object.keys(save).map((key) => `:${key}`).join(", ");

//       const query = `
//         INSERT INTO tbl_product_features (${keys}) 
//         VALUES (${values})
//       `;

//       const [result] = await sequelize.query(query, {
//         replacements: save,
//         type: QueryTypes.INSERT,
//       });

//       return { action: "insert", id: result }; // MySQL: result = insertId
//     }
//   } catch (error) {
//     console.error("Error in saveOrUpdateProductFeature (model):", error);
//     throw error;
//   }
// };





export const saveOrUpdateProductFeature = async (id, post) => {
  try {
    if (id) {
      await ProductFeature.update(
        {
          section_id: post.section_id,
          description: post.description || "",
          feature_display_name: post.feature_display_name || "",
          product_id: post.product_id,
          type: post.type || 0,
          image: post.image || "",
        },
        { where: { id } }
      );
      return { action: "update", id };
    }

    const newFeature = await ProductFeature.create({
      section_id: post.section_id,
      description: post.description || "",
      feature_display_name: post.feature_display_name || "",
      product_id: post.product_id,
      type: post.type || 0,
      image: post.image || "",
      created_at: post.created_at || new Date(),
    });

    return { action: "insert", id: newFeature.id };
  } catch (error) {
    console.error("Error in saveOrUpdateProductFeature (service):", error);
    throw error;
  }
};