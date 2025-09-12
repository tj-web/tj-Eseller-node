import sequelize from "../config/connection.js";
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
      type: QueryTypes.SELECT,
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
      type: QueryTypes.SELECT,
    });

    // Get Product Screenshots
    const screenshotsQuery = `
      SELECT id, image 
      FROM tbl_product_screenshots
      WHERE product_id = :product_id
    `;
    const screenshots = await sequelize.query(screenshotsQuery, {
      replacements: { product_id },
      type: QueryTypes.SELECT,
    });

    // Get Product Videos
    const videosQuery = `
      SELECT id, video_url 
      FROM tbl_product_videos
      WHERE product_id = :product_id
    `;
    const videos = await sequelize.query(videosQuery, {
      replacements: { product_id },
      type: QueryTypes.SELECT,
    });

    // Combine all data
    return {
      ...product,
      faqs,
      screenshot: screenshots,
      videos,
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
  order_by = null,
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

const defaultCols = {
  size: "hello",
  industries: "",
  business: "",
  organization_type: "",
  customer_support: "",
  integrations: "",
  ai_features: "",
  technology: "0",
  third_party_integration: "",
  property_type: "",
  training: "yes",
  hw_configuration: "",
  sw_configuration: "",
  updated_at: "",
};

export const saveOrUpdateProductSpecification = async (id, productData) => {
  const data = { ...defaultCols, ...productData };

  if (id) {
    // Build dynamic SET clause
    const setClause = Object.keys(data)
      .map((k) => `${k} = :${k}`)
      .join(", ");
    await sequelize.query(
      `UPDATE tbl_product_specification SET ${setClause} WHERE id = :id`,
      { replacements: { ...data, id }, type: QueryTypes.UPDATE }
    );
    return { id, ...data, updated: true };
  }

  // Build dynamic INSERT
  const cols = Object.keys(data).join(", ");
  const vals = Object.keys(data)
    .map((k) => `:${k}`)
    .join(", ");
  const [insertId] = await sequelize.query(
    `INSERT INTO tbl_product_specification (${cols}) VALUES (${vals})`,
    { replacements: data, type: QueryTypes.INSERT }
  );

  return { id: insertId, ...data, created: true };
};

export const getVendorBrands = async (vendor_id) => {
  const sql = `
    SELECT vbr.tbl_brand_id 
    FROM vendor_brand_relation AS vbr
    INNER JOIN tbl_brand AS tb ON tb.brand_id = vbr.tbl_brand_id
    WHERE vbr.tbl_brand_id != 0
      AND vbr.vendor_id = :vendor_id
      AND (vbr.status = 1 OR (tb.added_by = 'vendor' AND tb.added_by_id = :vendor_id))
  `;

  const results = await sequelize.query(sql, {
    replacements: { vendor_id },
    type: sequelize.QueryTypes.SELECT,
  });

  return results.map((row) => row.tbl_brand_id); // return brand_id array
};

// ----------------------------------------GetProductList----------------------------

export const getProductList = async (
  brand_arr,
  search_filter = {},
  order_by = "tp.product_id",
  order = "desc",
  limit,
  pageNumber
) => {
  const limitNum = limit ? parseInt(limit, 10) : null;
  const pageNum = pageNumber ? parseInt(pageNumber, 10) : 1;

  const offset = limitNum ? (pageNum - 1) * limitNum : 0;

  if (!brand_arr || brand_arr.length === 0) {
    return [];
  }

  let orderByColumn;
  switch (order_by) {
    case "s_id":
      orderByColumn = "tp.product_id";
      break;
    case "s_product_name":
      orderByColumn = "tp.product_name";
      break;
    case "s_status":
      orderByColumn = "tp.status";
      break;
    default:
      orderByColumn = "tp.product_id";
      order = "desc";
  }

  let sql = `
    SELECT tp.product_id, tp.product_name, tp.status, tb.brand_name, tpi.image
    FROM tbl_product AS tp
    LEFT JOIN tbl_brand AS tb ON tb.brand_id = tp.brand_id
    LEFT JOIN tbl_product_image AS tpi ON tpi.product_id = tp.product_id
    WHERE tp.is_deleted = 0
      AND tp.brand_id IN (:brand_arr)
  `;

  const replacements = { brand_arr };

  if (search_filter.srch_product_name) {
    sql += " AND tp.product_name LIKE :product_name";
    replacements.product_name = `%${search_filter.srch_product_name}%`;
  }

  if (search_filter.srch_status) {
    sql += " AND tp.status = :status";
    replacements.status = search_filter.srch_status;
  }

  sql += ` GROUP BY tp.product_id ORDER BY ${orderByColumn} ${order}`;

  if (limitNum) {
    sql += ` LIMIT ${limitNum} OFFSET ${offset}`;
  }

  const results = await sequelize.query(sql, {
    replacements,
    type: sequelize.QueryTypes.SELECT,
  });

  return results;
};



export const saveOrUpdateProductFeature = async (id, post) => {
  try {
    // Build save object
    const save = {
      section_id: post.section_id || null,
      description: post.description || "",
      feature_display_name: post.feature_display_name || "",
      product_id: post.product_id,
      type: post.type || 0,
      image: post.image || "",
      created_at: post.created_at || new Date(),
    };

    if (id) {
      // 🔹 UPDATE query
      const setClause = Object.keys(save)
        .map((key) => `${key} = :${key}`)
        .join(", ");

      const query = `
        UPDATE tbl_product_features 
        SET ${setClause} 
        WHERE id = :id
      `;

      await sequelize.query(query, {
        replacements: { ...save, id },
        type: QueryTypes.UPDATE,
      });

      return { action: "update", id };
    } else {
      // 🔹 INSERT query
      const keys = Object.keys(save).join(", ");
      const values = Object.keys(save)
        .map((key) => `:${key}`)
        .join(", ");

      const query = `
        INSERT INTO tbl_product_features (${keys}) 
        VALUES (${values})
      `;

      const [result] = await sequelize.query(query, {
        replacements: save,
        type: QueryTypes.INSERT,
      });

      return { action: "insert", id: result }; // MySQL: result = insertId
    }
  } catch (error) {
    console.error("Error in saveOrUpdateProductFeature (model):", error);
    throw error;
  }
};



export const isVendorProduct = async (product_id, brand_arr) => {
  const query = `
    SELECT COUNT(*) as count 
    FROM tbl_product 
    WHERE product_id = :product_id 
    AND brand_id IN (:brand_arr)
  `;

  const result = await sequelize.query(query, {
    replacements: { product_id, brand_arr },
    type: sequelize.QueryTypes.SELECT,
  });

  return result[0].count > 0; // returns true/false
};

// Fetch all features for product
export const getAllFeatures = async (product_id) => {
  const query = `
    SELECT * 
    FROM tbl_product_features 
    WHERE product_id = :product_id
  `;

  const result = await sequelize.query(query, {
    replacements: { product_id },
    type: sequelize.QueryTypes.SELECT,
  });

  return result;
};

export const isVendorProduc = async (productId, brandArr) => {
  const sql = `
    SELECT COUNT(*) AS count
    FROM tbl_product
    WHERE product_id = :productId
      AND brand_id IN (:brandArr)
  `;

  const result = await sequelize.query(sql, {
    replacements: { productId, brandArr },
    type: QueryTypes.SELECT,
  });

  return result[0].count > 0; // true/false
};




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
            replacements: [
              item.video_title,
              item.video_url,
              item.video_desc,
              item.product_id,
              item.id,
            ],
            type: QueryTypes.UPDATE,
          }
        );

        videoData.push(item);
      } else {
        // ➕ Insert
        const result = await sequelize.query(
          `INSERT INTO tbl_product_videos (video_title, video_url, video_desc, product_id)
           VALUES (?, ?, ?, ?)`,
          {
            replacements: [
              item.video_title,
              item.video_url,
              item.video_desc,
              item.product_id,
            ],
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




export const insertProductScreenshots = async (screenshotsData) => {
  try {
    if (!screenshotsData || screenshotsData.length === 0) return;

    const inserts = [];
    const updates = [];

    // Separate insert vs update
    for (const item of screenshotsData) {
      if (item.id) {
        updates.push(item);
      } else {
        inserts.push(item);
      }
    }

    if (inserts.length > 0) {
      const placeholders = inserts.map(() => "(?, ?, ?)").join(", ");
      const values = inserts.flatMap((item) => [
        item.product_id,
        item.image,
        item.alt_text || null,
      ]);

      const insertQuery = `
    INSERT INTO tbl_product_screenshots (product_id, image, img_alt)
    VALUES ${placeholders}
  `;

      const [result] = await sequelize.query(insertQuery, {
        replacements: values,
        type: QueryTypes.INSERT,
      });

      // attach generated IDs back to inserts
      const insertedIds = Array.from(
        { length: inserts.length },
        (_, i) => result
      );

      inserts.forEach((item, index) => {
        item.id = insertedIds[index];
      });
    }

    // Run updates one by one
    for (const item of updates) {
      await sequelize.query(
        `UPDATE tbl_product_screenshots 
         SET product_id = ?, image = ?, img_alt = ?
         WHERE id = ?`,
        {
          replacements: [
            item.product_id,
            item.image,
            item.alt_text || null,
            item.id,
          ],
          type: QueryTypes.UPDATE,
        }
      );
    }

    return { inserted: inserts.length, updated: updates.length };
  } catch (error) {
    console.error("Error inserting/updating product screenshots:", error);
    throw error;
  }
};


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
            replacements: [
              item.image,
              item.title,
              item.description,
              product_id,
              item.id,
            ],
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
            replacements: [
              item.image,
              item.title,
              item.description,
              product_id,
            ],
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
              item.id,
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
              item.product_id,
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




export const getSelectedColumns = async (table, columns = [], where = {}) => {
  const cols = columns.length > 0 ? columns.join(",") : "*";

  // Build WHERE clause dynamically
  const whereKeys = Object.keys(where);
  const whereClause =
    whereKeys.length > 0
      ? "WHERE " + whereKeys.map((key) => `${key} = :${key}`).join(" AND ")
      : "";

  const query = `SELECT ${cols} FROM ${table} ${whereClause} LIMIT 1`;

  const result = await sequelize.query(query, {
    replacements: where,
    type: QueryTypes.SELECT,
  });

  return result.length > 0 ? result[0] : null;
};

// --------------This is the main raw query for adding the product in the product tble -------

//   export const saveProduct = async (save, productId = null) => {
//     let newProductId;

//     if (productId) {
//       // Update existing product
//       const setClause = Object.keys(save)
//         .map((key) => `${key} = :${key}`)
//         .join(", ");

//       const query = `UPDATE tbl_product SET ${setClause} WHERE product_id = :product_id`;

//       await sequelize.query(query, {
//         replacements: { ...save, product_id: productId },
//         type: QueryTypes.UPDATE,
//       });

//       newProductId = productId;
//     } else {
//       // Insert new product
//       const keys = Object.keys(save);
//       const values = keys.map((key) => `:${key}`).join(", ");

//       const query = `INSERT INTO tbl_product (${keys.join(",")}) VALUES (${values})`;

//       const [result] = await sequelize.query(query, {
//         replacements: save,
//         type: QueryTypes.INSERT,
//       });

//       newProductId = result;
//     }

//     return newProductId;

// };

export const saveProduct = async (save, imageUrl = null, productId = null) => {
  let newProductId;

  if (productId) {
    // Update existing product
    const setClause = Object.keys(save)
      .map((key) => `${key} = :${key}`)
      .join(", ");

    const query = `UPDATE tbl_product SET ${setClause} WHERE product_id = :product_id`;

    await sequelize.query(query, {
      replacements: { ...save, product_id: productId },
      type: QueryTypes.UPDATE,
    });

    newProductId = productId;
  } else {
    // Insert new product
    const keys = Object.keys(save);
    const values = keys.map((key) => `:${key}`).join(", ");

    const query = `INSERT INTO tbl_product (${keys.join(
      ","
    )}) VALUES (${values})`;

    const [result] = await sequelize.query(query, {
      replacements: save,
      type: QueryTypes.INSERT,
    });

    newProductId = result;
  }

  if (imageUrl) {
    const fileName = imageUrl.split("/").pop(); // e.g. "myimage.png"

    const imageName = fileName.replace(/\.[^/.]+$/, ""); // e.g. "myimage"

    const imageQuery = `
    INSERT INTO tbl_product_image (product_id, image, image_name)
    VALUES (:product_id, :image, :image_name)
  `;

    await sequelize.query(imageQuery, {
      replacements: {
        product_id: newProductId,
        image: fileName,
        image_name: imageName,
      },
      type: QueryTypes.INSERT,
    });
  }

  return newProductId;
};





