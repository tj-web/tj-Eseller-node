import sequelize from "../../db/connection.js";
import { QueryTypes } from "sequelize";

export const insertProductScreenshots = async (screenshotsData) => {
  try {
    if (!screenshotsData || screenshotsData.length === 0) return;
    const placeholders = screenshotsData.map(() => "(?, ?, ?)").join(", ");

    const values = screenshotsData.flatMap(item => [
      item.product_id,
      item.image,             // filename
      item.alt_text || null   // img_alt
    ]);

    const query = `
      INSERT INTO tbl_product_screenshots (product_id, image, img_alt)
      VALUES ${placeholders}
    `;

    await sequelize.query(query, {
      replacements: values,
      type: QueryTypes.INSERT,
    });

  } catch (error) {
    console.error("Error inserting product screenshots:", error);
    throw error;
  }
};



