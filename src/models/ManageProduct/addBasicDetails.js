

// -----------This is the generic helper fucntion for the query---------------------------

import sequelize from "../../db/connection.js";
import { QueryTypes } from "sequelize";

export const getSelectedColumns = async (table, columns = [], where = {}) => {
  const cols = columns.length > 0 ? columns.join(",") : "*";

  // Build WHERE clause dynamically
  const whereKeys = Object.keys(where);
  const whereClause =
    whereKeys.length > 0
      ? "WHERE " +
        whereKeys.map((key) => `${key} = :${key}`).join(" AND ")
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

    const query = `INSERT INTO tbl_product (${keys.join(",")}) VALUES (${values})`;

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
      image_name: imageName  
    },
    type: QueryTypes.INSERT,
  });
}


  return newProductId;
};




