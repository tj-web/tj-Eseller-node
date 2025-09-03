
import sequelize from "../../db/connection.js";
import { QueryTypes } from "sequelize";

export const addGalleryModel = async (filesData, product_id) => {
  try {
    const galleryData = [];

    for (const item of filesData) {
      const [insertId] = await sequelize.query(
        `INSERT INTO tbl_description_gallery (image, title, description, product_id)
         VALUES (?, ?, ?, ?)`,
        {
          replacements: [item.image, item.title, item.description, product_id],
          type: QueryTypes.INSERT,
        }
      );

      galleryData.push({
        id: insertId,
        image: item.image,
        title: item.title,
        description: item.description,
        product_id,
      });
    }

    return galleryData;
  } catch (error) {
    console.error("Error in addGalleryModel:", error);
    throw error;
  }
};

