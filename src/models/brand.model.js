import { Sequelize } from "sequelize";
import sequelize from "../db/connection.js";
import { uploadfile2 } from "../utilis/s3Uploader.js";
export async function get_vendor_brands({
  vendor_id,
  orderby,
  order,
  srch_brand_name,
  srch_status,
  limit = 10,
  pagenumber = 1,
}) {
  let whereCondition = "";
  let offset = (pagenumber - 1) * limit;
  // whereCondition = `vbr.vendor_id = ${vendor_id} AND vbr.tbl_brand_id != 0`;
  switch (orderby) {
    case "s_id":
      orderby = "tb.id";

      break;
    case "s_brand_name":
      orderby = "tb.brand_name";

      break;
    case "s_status":
      orderby = "vbr.status";

      break;
    default:
      orderby = "tb.brand_id";
  }

  order = order || "desc";
  whereCondition = `vbr.vendor_id = :vendor_id AND vbr.tbl_brand_id != 0`;

  if (srch_brand_name)
    whereCondition += ` AND tb.brand_name LIKE :srch_brand_name`;

  if (srch_status) whereCondition += ` AND vbr.status = :srch_status`;

  const sql = `SELECT
    vbr.id,
    vbr.vendor_id,
    vbr.tbl_brand_id,
    vbr.status,
    tb.brand_name,
    tb.description,
    tb.image,
    tb.status AS brand_status
FROM
    vendor_brand_relation AS vbr
LEFT JOIN tbl_brand AS tb
ON
    tb.brand_id = vbr.tbl_brand_id
WHERE
    ${whereCondition}
ORDER BY :orderby :order

LIMIT :offset, :limit;`;

  const results = await sequelize.query(sql, {
    replacements: {
      vendor_id,
      limit: +limit,
      offset,
      orderby,
      order,
      srch_brand_name,
      srch_status,
    },
    type: sequelize.QueryTypes.SELECT,
  });

  return results;
}

/****************************get brands details*************************************/

export const get_brand_by_id = async (vendor_id, brand_id) => {
  const query = `
    SELECT 
      b.brand_name,
      b.description,
      b.image,
      b.status,
      tbi.id AS tbl_info_id,
      tbi.information,
      tbi.founded_on,
      tbi.founders,
      tbi.company_size,
      tbi.location,
      tbi.industry
    FROM tbl_brand AS b
    INNER JOIN vendor_brand_relation AS vbr
      ON vbr.tbl_brand_id = b.brand_id
    LEFT JOIN tbl_brand_info AS tbi
      ON tbi.tbl_brand_id = b.brand_id
    WHERE b.brand_id = :brand_id
      AND vbr.vendor_id = :vendor_id 
    LIMIT 1
  `;

  const [results] = await sequelize.query(query, {
    replacements: { brand_id, vendor_id },
    type: sequelize.QueryTypes.SELECT,
  });

  return results || null;
};
/************************CHECK BRAND METHOD*************************/

export const checkBrandName = async (brand_name, brand_id) => {
  try {
    let query = `
      SELECT * 
      FROM tbl_brand 
      WHERE is_deleted = 0 
        AND brand_name = :brand_name
    `;

    if (brand_id) {
      query += " AND brand_id != :brand_id";
    }

    // Use array destructuring properly
    const [results] = await sequelize.query(query, {
      replacements: { brand_name, brand_id },
      type: sequelize.QueryTypes.SELECT,
    });

    // `results` itself is already the array of rows
    return results == undefined ? true : false;
  } catch (error) {
    console.error("Error in checkBrandName:", error);
    throw error;
  }
};
/**********default values for tbl_brands*********** */
export const tbl_brand_Cols = {
  image_name: "",
  banner: "",
  banner_name: "",
  description: "",
  slug: "",
  website_url: "",
  tags: "",
  page_title: "",
  page_heading: "",
  page_keyword: "",
  page_description: "",
  oem_onboarded_by: "",
  agreement_attach: "",
  lead_url: "",
  lead_username: "",
  lead_password: "",
  commission_type: 0,
  commission: 0,
  commission_comment: "",
  renewal_terms: 0.0,
  renewal_terms_comment: "",
  payment_terms: "",
  payment_terms_comment: "",
  remarks: "",
  vendor_sheet: "",
};

export async function saveBrand(save, brand_id = "") {
  try {
    if (brand_id) {
      //  Update existing brand
      const setClause = Object.keys(save)
        .map((key) => `${key} = :${key}`)
        .join(", ");

      await sequelize.query(
        `UPDATE tbl_brand 
         SET ${setClause} 
         WHERE id = :brand_id`,
        {
          replacements: { ...save, brand_id },
          type: sequelize.QueryTypes.UPDATE,
        }
      );

      return brand_id;
    } else {
      //  Insert new brand
      const keys = Object.keys(save).join(", ");
      const values = Object.keys(save)
        .map((key) => `:${key}`)
        .join(", ");

      const [result] = await sequelize.query(
        `INSERT INTO tbl_brand (${keys}) VALUES (${values})`,
        {
          replacements: save,
          type: sequelize.QueryTypes.INSERT,
        }
      );

      // MySQL returns [insertId, affectedRows]
      return result;
    }
  } catch (error) {
    console.error("Error in saveBrand:", error);
    return null;
  }
}

/*****************save brand info ********************* */

export const saveBrandInfo = async (save) => {
  try {
    
    const keys = Object.keys(save).join(", ");
    const values = Object.keys(save)
      .map((key) => `:${key}`)
      .join(", ");

    const query = `INSERT INTO tbl_brand_info (${keys}) VALUES (${values})`;

    const [result] = await sequelize.query(query, {
      replacements: save,
      type: sequelize.QueryTypes.INSERT,
    });

    
    return result;
  } catch (error) {
    console.error("Error in saveBrandInfo:", error);
    throw error;
  }
};

export const saveVendorRelationBrand = async (vendorId, brandId) => {
  try {
    const vendorBrandRelation = {
      vendor_id: vendorId,
      tbl_brand_id: brandId,
      status: 0,
      is_requested: 0,
      created_at: new Date(), 
    };

    const keys = Object.keys(vendorBrandRelation).join(", ");
    const values = Object.keys(vendorBrandRelation)
      .map((key) => `:${key}`)
      .join(", ");

    const query = `
      INSERT INTO vendor_brand_relation (${keys}) 
      VALUES (${values})
    `;

    await sequelize.query(query, {
      replacements: vendorBrandRelation,
      type: sequelize.QueryTypes.INSERT,
    });

    console.log(" Vendor-brand relation saved!");
  } catch (error) {
    console.error(" Error in saveVendorRelationBrand:", error);
    throw error;
  }
};

export const updateVendorLogs = async (
  updateArr,
  itemId,
  profileId,
  status,
  updateId,
  action,
  module
) => {
  try {
    let insertArray = [];
    let updateArray = [];

    
    const vendorLogDetails = await sequelize.query(
      `
      SELECT id, column_name, linked_attribute
      FROM vendor_logs
      WHERE item_id = :itemId AND status = 0 AND module = :module
      `,
      {
        replacements: { itemId, module },
        type: sequelize.QueryTypes.SELECT,
      }
    );

  
    const unacceptedChanges = {};
    const unacceptedChangesIds = {};

    vendorLogDetails.forEach((row) => {
      unacceptedChanges[row.id] = row.column_name;
      unacceptedChangesIds[row.column_name] = row.id;
    });

    const allowedDuplicateColumns = [
      "video_title",
      "video_url",
      "gallery_title",
      "gallery_description",
      "gallery_image",
      "screenshot",
      "screenshot_img_alt",
      "enrichment_image",
      "type",
    ];

    
    for (const [tableName, columns] of Object.entries(updateArr)) {
      const pKey = columns.p_key || "";
      const updateIdVal = columns.update_id || "";

     
      let linkedAttr = "";
      if (vendorLogDetails.length > 0 && vendorLogDetails[0].linked_attribute) {
        linkedAttr = vendorLogDetails[0].linked_attribute;
      } else if (action === "updated" && module !== "brand") {
        linkedAttr = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
      }

      for (const [columnName, updatedValue] of Object.entries(columns)) {
        if (columnName !== "p_key" && columnName !== "update_id") {
          if (
            !Object.values(unacceptedChanges).includes(columnName) ||
            (!updateIdVal && allowedDuplicateColumns.includes(columnName))
          ) {
            insertArray.push({
              item_id: itemId,
              module,
              action_performed: action,
              action_by: profileId,
              table_name: tableName,
              column_name: columnName,
              p_key: pKey,
              updated_column_value: updatedValue,
              linked_attribute: linkedAttr,
              item_updated_id: updateIdVal,
              reject_reason: "",
              status,
              created_at: new Date(),
              updated_at: new Date(),
            });
          } else {
            updateArray.push({
              id: unacceptedChangesIds[columnName],
              column_name: columnName,
              updated_column_value: updatedValue,
            });
          }
        }
      }
    }

   
    if (insertArray.length > 0) {
      const keys = Object.keys(insertArray[0]);
      const values = insertArray
        .map(
          (row) =>
            `(${keys.map((key) => sequelize.escape(row[key])).join(", ")})`
        )
        .join(", ");

      const query = `
        INSERT INTO vendor_logs (${keys.join(", ")})
        VALUES ${values}
      `;
      await sequelize.query(query);
    }

    
    if (updateArray.length > 0) {
      for (const row of updateArray) {
        await sequelize.query(
          `
          UPDATE vendor_logs
          SET column_name = :column_name,
              updated_column_value = :updated_column_value
          WHERE id = :id
          `,
          {
            replacements: row,
            type: sequelize.QueryTypes.UPDATE,
          }
        );
      }
    }

    console.log(" updateVendorLogs executed successfully!");
  } catch (error) {
    console.error(" Error in updateVendorLogs:", error);
    throw error;
  }
};

/*******************view brand details ********************/

export const viewBrand = async (brand_id) => {
  try {
    if (!brand_id) {
      return false;
    }

    const [brandDetail] = await sequelize.query(
      `
      SELECT brand_name, description, image, status
      FROM tbl_brand
      WHERE brand_id = :brand_id
      AND is_deleted = 0
      LIMIT 1
      `,
      {
        replacements: { brand_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!brandDetail) {
      return false;
    }

    const brandLoc = await sequelize.query(
      `
      SELECT  location_id
      FROM tbl_brand_location
      WHERE brand_id = :brand_id
      `,
      {
        replacements: { brand_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const locArr = brandLoc.map((loc) => loc.location_id);

    const data = {
      active_tab: "view_brand",
      brand_name: brandDetail.brand_name,
      description: brandDetail.description,
      image: brandDetail.image,
      status: brandDetail.status,
      brand_location: brandLoc,
      location_ids: locArr,
    };
    return data;
  } catch (error) {
    console.error("Error in viewBrand:", error);
    return false;
  }
};

export const getBrandLocation = async (brand_id) => {
  try {
    const brandLocations = await sequelize.query(
      `
      SELECT tbl.id, tbl.location_id, tc.city_name
      FROM tbl_brand_location AS tbl
      LEFT JOIN tbl_city AS tc ON tc.city_id = tbl.location_id
      WHERE tbl.brand_id = :brand_id
      `,
      {
        replacements: { brand_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return brandLocations;
  } catch (error) {
    console.error("Error in getBrandLocation:", error);
    throw error;
  }
};

export const updateBrandinfo = async (brandId, brandSave, brandDetail, image = null, old_image = null) => {
  try {
    if (!brandId) return { message: "Brand ID required" };

    
    let imgPath = old_image;
    if (image) {
      imgPath = uploadfile2(image);
    }
    brandSave.image = imgPath;

   
    const brandDiff = {};
    for (let key in brandSave) {
      if (brandSave[key] != brandDetail[key]) {
        brandDiff[key] = brandSave[key];
      }
    }

    
    if (Object.keys(brandDiff).length === 0) {
      return { message: "No changes detected" };
    }

    if (brandDiff.brand_name || brandDiff.image) {
      await sequelize.query(
        `UPDATE tbl_brand 
         SET brand_name = COALESCE(:brand_name, brand_name),
             brand_image = COALESCE(:brand_image, brand_image)
         WHERE brand_id = :brand_id`,
        {
          replacements: {
            brand_id: brandId,
            brand_name: brandDiff.brand_name || null,
            brand_image: brandDiff.image || null,
          },
        }
      );
    }

  
    if (
      brandDiff.founded_on ||
      brandDiff.founders ||
      brandDiff.company_size ||
      brandDiff.location ||
      brandDiff.industry ||
      brandDiff.information
    ) {
      await sequelize.query(
        `UPDATE tbl_brand_info 
         SET founded_on = COALESCE(:founded_on, founded_on),
             founders = COALESCE(:founders, founders),
             company_size = COALESCE(:company_size, company_size),
             location = COALESCE(:location, location),
             industry = COALESCE(:industry, industry),
             information = COALESCE(:information, information)
         WHERE id = :tbl_info_id`,
        {
          replacements: {
            tbl_info_id: brandDetail.tbl_info_id,
            founded_on: brandDiff.founded_on || null,
            founders: brandDiff.founders || null,
            company_size: brandDiff.company_size || null,
            location: brandDiff.location || null,
            industry: brandDiff.industry || null,
            information: brandDiff.information || null,
          },
        }
      );
    }

    return { success: true, message: "Brand info updated successfully" };
  } catch (err) {
    console.error("Error updating brand info:", err);
    throw err;
  }
};

