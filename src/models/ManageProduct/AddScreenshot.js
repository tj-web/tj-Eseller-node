
import sequelize from "../../db/connection.js";
import { QueryTypes } from "sequelize";
import ProductScreenshot from "../productScreenshot.js";

// export const insertProductScreenshots = async (screenshotsData) => {
//   try {
//     if (!screenshotsData || screenshotsData.length === 0) return;

//     const inserts = [];
//     const updates = [];

//     // Separate insert vs update
//     for (const item of screenshotsData) {
//       if (item.id) {
//         updates.push(item);
//       } else {
//         inserts.push(item);
//       }
//     }

//     if (inserts.length > 0) {
//   const placeholders = inserts.map(() => "(?, ?, ?)").join(", ");
//   const values = inserts.flatMap(item => [
//     item.product_id,
//     item.image,
//     item.alt_text || null,
//   ]);

//   const insertQuery = `
//     INSERT INTO tbl_product_screenshots (product_id, image, img_alt)
//     VALUES ${placeholders}
//   `;

//   const [result] = await sequelize.query(insertQuery, {
//     replacements: values,
//     type: QueryTypes.INSERT,
//   });

//   // attach generated IDs back to inserts
//   const insertedIds = Array.from(
//     { length: inserts.length },
//     (_, i) => result 
//   );

//   inserts.forEach((item, index) => {
//     item.id = insertedIds[index];
//   });
// }


//     // Run updates one by one
//     for (const item of updates) {
//       await sequelize.query(
//         `UPDATE tbl_product_screenshots 
//          SET product_id = ?, image = ?, img_alt = ?
//          WHERE id = ?`,
//         {
//           replacements: [item.product_id, item.image, item.alt_text || null, item.id],
//           type: QueryTypes.UPDATE,
//         }
//       );
//     }

//     return { inserted: inserts.length, updated: updates.length };

//   } catch (error) {
//     console.error("Error inserting/updating product screenshots:", error);
//     throw error;
//   }
// };



export const insertProductScreenshots = async (screenshotsData) => {
  try {
    if (!screenshotsData || screenshotsData.length === 0) return { inserted: 0, updated: 0 };

    
    const formattedData = screenshotsData.map(item => ({
      id: item.id || null, 
      product_id: item.product_id,
      image: item.image,
      img_alt: item.alt_text || item.img_alt || null, 
      sort_order: item.sort_order || 0,
      status: item.status ?? 1,
      is_deleted: item.is_deleted ?? 0,
      section_id: item.section_id || null
    }));

    // 2. Perform the bulk operation
    // This will check the PRIMARY KEY (id). 
    // If ID exists, it UPDATES. If ID is null/doesn't exist, it INSERTS.
    const result = await ProductScreenshot.bulkCreate(formattedData, {
      updateOnDuplicate: ["product_id", "image", "img_alt", "sort_order", "status", "is_deleted", "section_id"]
    });

    return { totalProcessed: result.length };
  } catch (error) {
    console.error("Error in insertProductScreenshots:", error);
    throw error;
  }
};
