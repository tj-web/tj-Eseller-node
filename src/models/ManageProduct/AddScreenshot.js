// import sequelize from "../../db/connection.js";
// import { QueryTypes } from "sequelize";

// export const insertProductScreenshots = async (screenshotsData) => {
//   try {
//     if (!screenshotsData || screenshotsData.length === 0) return;
//     const placeholders = screenshotsData.map(() => "(?, ?, ?)").join(", ");

//     const values = screenshotsData.flatMap(item => [
//       item.product_id,
//       item.image,             // filename
//       item.alt_text || null   // img_alt
//     ]);

//     const query = `
//       INSERT INTO tbl_product_screenshots (product_id, image, img_alt)
//       VALUES ${placeholders}
//     `;

//     await sequelize.query(query, {
//       replacements: values,
//       type: QueryTypes.INSERT,
//     });

//   } catch (error) {
//     console.error("Error inserting product screenshots:", error);
//     throw error;
//   }
// };

import sequelize from "../../db/connection.js";
import { QueryTypes } from "sequelize";

export const insertProductScreenshots = async (screenshotsData) => {
  try {
    if (!screenshotsData || screenshotsData.length === 0) return;

    const inserts = [];
    const updates = [];

    // Separate insert vs update
    for (const item of screenshotsData) {
      if (item.id) {
        updates.push(item);
      } else {
        inserts.push(item);
      }
    }

    // Run bulk insert
    if (inserts.length > 0) {
      const placeholders = inserts.map(() => "(?, ?, ?)").join(", ");
      const values = inserts.flatMap(item => [
        item.product_id,
        item.image,
        item.alt_text || null,
      ]);

      const insertQuery = `
        INSERT INTO tbl_product_screenshots (product_id, image, img_alt)
        VALUES ${placeholders}
      `;

      await sequelize.query(insertQuery, {
        replacements: values,
        type: QueryTypes.INSERT,
      });
    }

    // Run updates one by one
    for (const item of updates) {
      await sequelize.query(
        `UPDATE tbl_product_screenshots 
         SET product_id = ?, image = ?, img_alt = ?
         WHERE id = ?`,
        {
          replacements: [item.product_id, item.image, item.alt_text || null, item.id],
          type: QueryTypes.UPDATE,
        }
      );
    }

    return { inserted: inserts.length, updated: updates.length };

  } catch (error) {
    console.error("Error inserting/updating product screenshots:", error);
    throw error;
  }
};


