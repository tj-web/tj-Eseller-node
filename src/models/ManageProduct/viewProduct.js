import sequelize from "../../db/connection.js";
import { QueryTypes } from "sequelize";

export const getProductDetail = async (product_id) => {
  try {
    // Get main product data with joins
    const productQuery = `
      SELECT 
        tp.product_name,
        tpd.overview,
        tpd.description,
        tpi.image,
        tp.status,
        tps.industries,
        tps.business,
        tps.deployment,
        tps.device,
        tps.operating_system,
        tps.hw_configuration,
        tps.sw_configuration,
        tp.brand_id,
        tp.website_url
      FROM tbl_product AS tp
      LEFT JOIN tbl_product_specification AS tps
        ON tps.product_id = tp.product_id
      LEFT JOIN tbl_product_description AS tpd
        ON tpd.product_id = tp.product_id
      LEFT JOIN tbl_product_image AS tpi
        ON tpi.product_id = tp.product_id
      WHERE tp.product_id = :product_id
      LIMIT 1
    `;

    const [product] = await sequelize.query(productQuery, {
      replacements: { product_id },
      type: QueryTypes.SELECT
    });

    if (!product) return null;

    // Get Product FAQs
    const faqsQuery = `
      SELECT question, answer 
      FROM tbl_product_faqs
      WHERE product_id = :product_id
    `;
    const faqs = await sequelize.query(faqsQuery, {
      replacements: { product_id },
      type: QueryTypes.SELECT
    });

    // Get Product Screenshots
    const screenshotsQuery = `
      SELECT id, image 
      FROM tbl_product_screenshots
      WHERE product_id = :product_id
    `;
    const screenshots = await sequelize.query(screenshotsQuery, {
      replacements: { product_id },
      type: QueryTypes.SELECT
    });

    // Get Product Videos
    const videosQuery = `
      SELECT id, video_url 
      FROM tbl_product_videos
      WHERE product_id = :product_id
    `;
    const videos = await sequelize.query(videosQuery, {
      replacements: { product_id },
      type: QueryTypes.SELECT
    });

    // Combine all data
    return {
      ...product,
      faqs,
      screenshot: screenshots,
      videos
    };

  } catch (error) {
    console.error("Error in getProductDetail:", error);
    throw error;
  }
};
