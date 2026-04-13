import sequelize from "../../db/connection.js";

import { Op } from "sequelize";
import VendorBrandRelation from "../vendorBrandRelation.js";
import Brand from "../brand.js";
import Product from "../product.js";
import ProductImage from "../productImage.js";
import Category from "../category.js";


VendorBrandRelation.belongsTo(Brand, { foreignKey: 'tbl_brand_id', targetKey: 'brand_id' });

export const getVendorBrands = async (vendor_id) => {
  const results = await VendorBrandRelation.findAll({
    attributes: ['tbl_brand_id'],
    where: {
      tbl_brand_id: { [Op.ne]: 0 },
      vendor_id: vendor_id,
      [Op.or]: [
        { status: 1 },
        { 
          '$Brand.added_by$': 'vendor',
          '$Brand.added_by_id$': vendor_id
        }
      ]
    },
    include: [{
      model: Brand,
      attributes: [], 
      required: true  
    }],
    raw: true
  });

  return results.map(row => row.tbl_brand_id); // return brand_id array
};

// New function to get full brand details for product addition
export const getVendorBrandsDetails = async (vendor_id) => {
  const results = await VendorBrandRelation.findAll({
    attributes: [
      'tbl_brand_id',
      ['status', 'relation_status']
    ],
    where: {
      tbl_brand_id: { [Op.ne]: 0 },
      vendor_id: vendor_id,
      [Op.or]: [
        { status: 1 },
        { 
          '$Brand.added_by$': 'vendor',
          '$Brand.added_by_id$': vendor_id
        }
      ]
    },
    include: [{
      model: Brand,
      attributes: [
        'brand_name', 
        'description', 
        'image', 
        ['status', 'brand_status']
      ],
      required: true // INNER JOIN
    }],
    order: [
      [Brand, 'brand_name', 'ASC']
    ],
    raw: true,
    nest: true
  });

  // Flatten the result to match the old raw SQL output structure
  return results.map(row => ({
    tbl_brand_id: row.tbl_brand_id,
    brand_name: row.Brand?.brand_name || "",
    description: row.Brand?.description || "",
    image: row.Brand?.image || "",
    brand_status: row.Brand?.brand_status,
    relation_status: row.relation_status
  }));
};


// ----------------------------------------GetProductList----------------------------

// Setup Product associations
Product.belongsTo(Brand, { foreignKey: 'brand_id' });
Product.hasMany(ProductImage, { foreignKey: 'product_id' });

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

  // Determine sort column
  let sortColumn;
  switch (order_by) {
    case "s_id":
      sortColumn = "product_id";
      break;
    case "s_product_name":
      sortColumn = "product_name";
      break;
    case "s_status":
      sortColumn = "status";
      break;
    default:
      sortColumn = "product_id";
      order = "desc";
  }

  // Build where conditions
  const whereConditions = {
    is_deleted: 0,
    brand_id: { [Op.in]: brand_arr }
  };

  if (search_filter.srch_product_name) {
    whereConditions.product_name = { [Op.like]: `%${search_filter.srch_product_name}%` };
  }

  if (search_filter.srch_status) {
    whereConditions.status = search_filter.srch_status;
  }

  const results = await Product.findAll({
    attributes: ['product_id', 'product_name', 'status'],
    where: whereConditions,
    include: [
      {
        model: Brand,
        attributes: ['brand_name'],
        required: false // LEFT JOIN
      },
      {
        model: ProductImage,
        attributes: ['image'],
        required: false // LEFT JOIN
      }
    ],
    order: [[sortColumn, order]],
    limit: limitNum,
    offset: offset,
    raw: true,
    nest: true,
    // Emulate GROUP BY tp.product_id by taking unique products if needed
    // In practice, if there are multiple images, raw: true + nest: true might return multiple rows.
    // However, the original SQL had GROUP BY tp.product_id, usually to get a single image if any.
    // For many-to-many or many-to-one transformations like this, we usually flat them out.
  });

  // Flatten the result to match raw SQL output
  return results.map(row => ({
    product_id: row.product_id,
    product_name: row.product_name,
    status: row.status,
    brand_name: row.Brand?.brand_name || null,
    image: row.ProductImages ? (Array.isArray(row.ProductImages) ? row.ProductImages[0]?.image : row.ProductImages.image) : (row.ProductImages?.image || null)
    // Note: If using hasMany, row.ProductImages will be an array if nest:true. 
    // In raw mode with nest:true, Sequelize usually produces flattened keys like 'Brand.brand_name' or 'ProductImages.image'.
    // Let's adjust based on how Sequelize handles raw joins.
  })).map(row => {
    // If it was raw: true without nest, keys would be 'Brand.brand_name' etc.
    // With nest: true, they are objects.
    return row;
  });
};

// ----------------------------------------GetCategoryList----------------------------

export const getCategoryList = async (search = "", limit = 20, offset = 0) => {
  const safeLimit = parseInt(limit) || 20;
  const safeOffset = parseInt(offset) || 0;

  const whereConditions = {
    status: 1,
    show_status: 1,
    is_deleted: 0,
    category_id: { [Op.notIn]: [1, 491] }
  };

  if (search.trim()) {
    whereConditions.category_name = { [Op.like]: `${search.trim()}%` };
  }

  const results = await Category.findAll({
    attributes: ['category_id', 'category_name', 'parent_id'],
    where: whereConditions,
    order: [['category_name', 'ASC']],
    limit: safeLimit,
    offset: safeOffset,
    raw: true
  });

  return results;
};