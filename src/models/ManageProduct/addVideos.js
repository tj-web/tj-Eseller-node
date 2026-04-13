import sequelize from "../../db/connection.js";
import { QueryTypes } from "sequelize";
import ProductVideo from "../productVideo.js";

// export const addVideoModel = async (videos) => {
//   try {
//     const videoData = [];

//     for (const item of videos) {
//       if (item.id) {
//         //  Update
//         await sequelize.query(
//           `UPDATE tbl_product_videos 
//            SET video_title = ?, video_url = ?, video_desc = ?, product_id = ?
//            WHERE id = ?`,
//           {
//             replacements: [item.video_title, item.video_url, item.video_desc, item.product_id, item.id],
//             type: QueryTypes.UPDATE,
//           }
//         );

//         videoData.push(item);
//       } else {
//         // ➕ Insert
//        const result= await sequelize.query(
//           `INSERT INTO tbl_product_videos (video_title, video_url, video_desc, product_id)
//            VALUES (?, ?, ?, ?)`,
//           {
//             replacements: [item.video_title, item.video_url, item.video_desc, item.product_id],
//             type: QueryTypes.INSERT,
//           }
//         );
//  videoData.push({ ...item, id: result?.insertId || null });
//       }
//     }

//     return videoData;
//   } catch (error) {
//     console.error("Error in addVideoModel:", error);
//     throw error;
//   }
// };


export const addVideoModel = async (videos) => {
  try {
    if (!videos || videos.length === 0) return [];

    // Map data to ensure all database fields from your image are handled
    const formattedVideos = videos.map(item => ({
      id: item.id || null,
      product_id: item.product_id,
      video_title: item.video_title,
      video_url: item.video_url,
      video_desc: item.video_desc,
      show_on_acd: item.show_on_acd ?? 0,
      show_in_comm: item.show_in_comm ?? 0,
      show_as_cover: item.show_as_cover ?? 0,
      publish_date: item.publish_date || null,
      is_deleted: item.is_deleted ?? 0,
      updated_at: item.id ? new Date() : null, // Set current timestamp only when updating (id exists)
      created_at: item.id ? undefined : new Date() // Set created_at only for new records
    }));

    // Perform Upsert (Update on Duplicate Key)
    const result = await ProductVideo.bulkCreate(formattedVideos, {
      updateOnDuplicate: [
        "video_title",
        "video_url",
        "video_desc",
        "product_id",
        "show_on_acd",
        "show_in_comm",
        "show_as_cover",
        "publish_date",
        "is_deleted",
        "updated_at" // ✅ Now includes updated_at in the update
      ]
    });

    // Return the original formatted data with IDs from the result
    // This ensures correct timestamps in the response
    return formattedVideos.map((item, index) => ({
      ...item,
      id: result[index]?.id || item.id, // Get the ID from the result if it was inserted
      created_at: item.created_at, // Keep original created_at logic
      updated_at: item.updated_at  // Keep original updated_at logic
    }));

  } catch (error) {
    console.error("Error in addVideoModel:", error);
    throw error;
  }
};