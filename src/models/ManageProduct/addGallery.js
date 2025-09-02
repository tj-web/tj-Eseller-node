import sequelize from "../../db/connection.js";
import { QueryTypes } from "sequelize";

export const addGalleryModel = async (files, titleArr, descriptionArr, product_id) => {
  try {
    const galleryData = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const title = titleArr[i] || titleArr[0]; // fallback to first if not enough
      const description = descriptionArr[i] || descriptionArr[0];

      const [insertId] = await sequelize.query(
        `INSERT INTO tbl_description_gallery (image, title, description, product_id)
         VALUES (?, ?, ?, ?)`,
        {
          replacements: [file.originalname, title, description, product_id],
          type: QueryTypes.INSERT,
        }
      );

      galleryData.push({
        id: insertId,
        image: file.originalname,
        title,
        description,
        product_id,
      });
    }

    return galleryData;
  } catch (error) {
    console.error("Error in addGalleryModel:", error);
    throw error;
  }
};
