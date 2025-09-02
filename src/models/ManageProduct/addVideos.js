import sequelize from "../../db/connection.js";
import { QueryTypes } from "sequelize";

export const addVideoModel = async (videos, titleArr, urlArr, video_descArr, product_id) => {
  try {
    const videoData = [];

    for (let i = 0; i < videos.length; i++) {
      const video_title = titleArr[i] || titleArr[0];
      const video_url = urlArr[i] || urlArr[0];
      const video_desc = video_descArr[i] || video_descArr[0];

      const [insertId] = await sequelize.query(
        `INSERT INTO tbl_product_videos (video_title, video_url, video_desc, product_id)
         VALUES (?, ?, ?, ?)`,
        {
          replacements: [video_title, video_url, video_desc, product_id],
          type: QueryTypes.INSERT,
        }
      );

      videoData.push({
        id: insertId,
        video_title,
        video_url,
        video_desc,
        product_id,
      });
    }

    return videoData;
  } catch (error) {
    console.error("Error in addVideoModel:", error);
    throw error;
  }
};
