import sequelize from "../../db/connection.js";

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

  return results.map(row => row.tbl_brand_id); // return brand_id array
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
  const limitNum = limit ? parseInt(limit, 10) : 3;
  const pageNum = pageNumber ? parseInt(pageNumber, 10) : 1;

  const offset = (pageNum - 1) * limitNum;

  if (!brand_arr || brand_arr.length === 0) {
    return [];
  }

  // Order mapping like in CI switch-case
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

  // Base query
  let sql = `
    SELECT tp.product_id, tp.product_name, tp.status, tb.brand_name, tpi.image
    FROM tbl_product AS tp
    LEFT JOIN tbl_brand AS tb ON tb.brand_id = tp.brand_id
    LEFT JOIN tbl_product_image AS tpi ON tpi.product_id = tp.product_id
    WHERE tp.is_deleted = 0
      AND tp.brand_id IN (:brand_arr)
  `;

  const replacements = { brand_arr };

  // Filters
  if (search_filter.srch_product_name) {
    sql += " AND tp.product_name LIKE :product_name";
    replacements.product_name = `%${search_filter.srch_product_name}%`;
  }

  if (search_filter.srch_status) {
    sql += " AND tp.status = :status";
    replacements.status = search_filter.srch_status;
  }

  sql += ` GROUP BY tp.product_id ORDER BY ${orderByColumn} ${order} LIMIT ${limitNum} OFFSET ${offset}`;

  const results = await sequelize.query(sql, {
    replacements,
    type: sequelize.QueryTypes.SELECT,
  });

  return results;
};
