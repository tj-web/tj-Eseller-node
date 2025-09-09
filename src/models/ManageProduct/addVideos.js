import sequelize from "../../db/connection.js";
import { QueryTypes } from "sequelize";

export const addVideoModel = async (videos) => {
  try {
    const videoData = [];

    for (const item of videos) {
      if (item.id) {
        //  Update
        await sequelize.query(
          `UPDATE tbl_product_videos 
           SET video_title = ?, video_url = ?, video_desc = ?, product_id = ?
           WHERE id = ?`,
          {
            replacements: [item.video_title, item.video_url, item.video_desc, item.product_id, item.id],
            type: QueryTypes.UPDATE,
          }
        );

        videoData.push(item);
      } else {
        // ➕ Insert
       const result= await sequelize.query(
          `INSERT INTO tbl_product_videos (video_title, video_url, video_desc, product_id)
           VALUES (?, ?, ?, ?)`,
          {
            replacements: [item.video_title, item.video_url, item.video_desc, item.product_id],
            type: QueryTypes.INSERT,
          }
        );
 videoData.push({ ...item, id: result?.insertId || null });
      }
    }

    return videoData;
  } catch (error) {
    console.error("Error in addVideoModel:", error);
    throw error;
  }
};
