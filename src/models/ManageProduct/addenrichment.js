import sequelize from "../../db/connection.js";
import { QueryTypes } from "sequelize";

export const upsertEnrichmentImages = async (enrichmentData) => {
// console.log("Enrichment Data:", enrichmentData);return;
  try {
    const saved = [];

    for (const item of enrichmentData) {
      if (item.id) {
        //  Update if ID is present
        await sequelize.query(
          `UPDATE tbl_product_enrichment_images 
           SET type = ?, image_width = ?, image_height = ?, image = ?, product_id = ?
           WHERE id = ?`,
          {
            replacements: [
              item.type,
              item.image_width,
              item.image_height,
              item.image,
              item.product_id,
              item.id
            ],
            type: QueryTypes.UPDATE,
          }
        );

        saved.push(item);
      } else {
        // ➕ Insert new record
        const [insertId] = await sequelize.query(
          `INSERT INTO tbl_product_enrichment_images 
           (type, image_width, image_height, image, product_id) 
           VALUES (?, ?, ?, ?, ?)`,
          {
            replacements: [
              item.type,
              item.image_width,
              item.image_height,
              item.image,
              item.product_id
            ],
            type: QueryTypes.INSERT,
          }
        );

        saved.push({
          ...item,
          id: insertId,
        });
      }
    }

    return saved; // only return newly processed records
  } catch (error) {
    console.error("Error in upsertEnrichmentImages:", error);
    throw error;
  }
};
