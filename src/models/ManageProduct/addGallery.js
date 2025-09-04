
import sequelize from "../../db/connection.js";
import { QueryTypes } from "sequelize";
export const addGalleryModel = async (filesData, product_id) => {
  try {
    const galleryData = [];

    for (const item of filesData) {
      if (item.id) {
        // Update existing record
        await sequelize.query(
          `UPDATE tbl_description_gallery 
           SET image = ?, title = ?, description = ?, product_id = ?
           WHERE id = ?`,
          {
            replacements: [item.image, item.title, item.description, product_id, item.id],
            type: QueryTypes.UPDATE,
          }
        );

        galleryData.push({ ...item, product_id });
      } else {
        // Insert new record
        const [insertId] = await sequelize.query(
          `INSERT INTO tbl_description_gallery (image, title, description, product_id)
           VALUES (?, ?, ?, ?)`,
          {
            replacements: [item.image, item.title, item.description, product_id],
            type: QueryTypes.INSERT,
          }
        );

        galleryData.push({ ...item, id: insertId, product_id });
      }
    }

    return galleryData;
  } catch (error) {
    console.error("Error in addGalleryModel:", error);
    throw error;
  }
};

