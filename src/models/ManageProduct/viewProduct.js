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


//--------------This function will fetch the data of the existing product for editing purpose----------------

export const geteditProductDetail = async (productId) => {
  try {
    // 1. Product details
    const productSql = `
      SELECT *
      FROM tbl_product AS tp
      WHERE tp.product_id = :productId
    `;
    const product = await sequelize.query(productSql, {
      replacements: { productId },
      type: QueryTypes.SELECT,
    });

    if (!product.length) return null;

    const productRow = product[0];

    // 2. Product image
    const imageSql = `
      SELECT image_id, image
      FROM tbl_product_image
      WHERE product_id = :productId
      LIMIT 1
    `;
    const image = await sequelize.query(imageSql, {
      replacements: { productId },
      type: QueryTypes.SELECT,
    });

    // 3. Product description
    const descSql = `
      SELECT id, overview
      FROM tbl_product_description
      WHERE product_id = :productId
      LIMIT 1
    `;
    const description = await sequelize.query(descSql, {
      replacements: { productId },
      type: QueryTypes.SELECT,
    });

    // 4. Product categories
    const catSql = `
      SELECT tpc.id, tc.parent_id, tc.category_id, tc.category_name
      FROM tbl_product_category AS tpc
      INNER JOIN tbl_category AS tc ON tc.category_id = tpc.category_id
      WHERE tpc.product_id = :productId
        AND tc.status = 1
        AND tc.is_deleted = 0
    `;
    const categories = await sequelize.query(catSql, {
      replacements: { productId },
      type: QueryTypes.SELECT,
    });

    // 5. Build final data object
    return {
      product_id: productRow.product_id,
      product_name: productRow.product_name,
      brand_id: productRow.brand_id,
      website_url: productRow.website_url,
      trial_available: productRow.trial_available,
      free_downld_available: productRow.free_downld_available,
      pricing_document: productRow.pricing_document,
      image: image.length ? image[0].image : null,
      overview: description.length ? description[0].overview : null,
      arr_cat_selected: categories,
    };
  } catch (error) {
    console.error("Error in geteditProductDetail:", error);
    throw error;
  }
};

//---------------------w cwd c clw c/////////////
// import { QueryTypes } from "sequelize";
// import sequelize from "../db/connection.js"; // adjust path to your DB connection

export const getSelectedCol = async ({
  table,
  columns = [],
  where = {},
  records = "single",
  flag = false,
  order_by = null
}) => {
  try {
    // Build SELECT part
    const cols = columns.length > 0 ? columns.join(", ") : "*";

    // Build WHERE part
    let whereClause = "";
    let replacements = {};
    if (Object.keys(where).length > 0) {
      const conditions = [];
      Object.entries(where).forEach(([key, value], index) => {
        conditions.push(`${key} = :${key}`);
        replacements[key] = value;
      });
      whereClause = "WHERE " + conditions.join(" AND ");
    }

    // Build ORDER BY part
    let orderClause = "";
    if (order_by && Object.keys(order_by).length > 0) {
      const key = Object.keys(order_by)[0];
      const direction = order_by[key];
      orderClause = `ORDER BY ${key} ${direction}`;
    }

    // Final query
    const query = `
      SELECT ${cols}
      FROM ${table}
      ${whereClause}
      ${orderClause}
    `;

    const result = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    // Handle single/multiple like CI
    if (records === "single") {
      return result.length > 0 ? (flag ? result[0] : result[0]) : null;
    } else {
      return flag ? result : result;
    }
  } catch (error) {
    console.error("Error in getSelectedColumns:", error);
    throw error;
  }
};





