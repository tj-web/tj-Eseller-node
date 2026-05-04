import sequelize from "../../db/connection.js";
import { uploadfile2 } from "../../utilis/s3Uploader.js"; 
import { Op, QueryTypes } from "sequelize";
import VendorBrandRelation from "../../models/vendorBrandRelation.model.js";
import Brand from "../../models/brand.model.js";
import TblLeads from "../../models/leads.model.js";
import Product from "../../models/product.model.js";
import ProductImage from "../../models/productImage.model.js";
import Category from "../../models/category.model.js";
import ProductSpecification from "../../models/productSpecification.model.js";
import VendorLog from "../../models/vendorLog.model.js";
import Setting from "../../models/websiteSetting.model.js"
import Language from "../../models/languages.model.js";
import fs from "fs";
import path from "path";
import ProductFeature from "../../models/productFeature.model.js";
import Feature from "../../models/features.model.js";
import ProductDescription from "../../models/productDescription.model.js";
import ProductCategory from "../../models/productCategory.model.js";
import OperatingSystem from "../../models/operatingSystem.model.js";
import ProductIndustry from "../../models/productIndustry.model.js";
import BusinessType from "../../models/businessType.model.js";
import ProductFaq from "../../models/productFaqs.model.js";
import ProductScreenshot from "../../models/productScreenshot.model.js";
import DescriptionGallery from "../../models/descriptionGallery.model.js"; 
import ProductEnrichmentImage from "../../models/productEnrichmentImage.model.js";
import ProductVideo from "../../models/productVideo.model.js";


VendorBrandRelation.belongsTo(Brand, { foreignKey: 'tbl_brand_id', targetKey: 'brand_id' });
// Setup Product associations
Product.belongsTo(Brand, { foreignKey: 'brand_id' });
Product.hasMany(ProductImage, { foreignKey: 'product_id' });

Product.hasMany(TblLeads, { foreignKey: 'product_id' });
TblLeads.belongsTo(Product, { foreignKey: 'product_id' });

// Setup associations for product details
Product.hasOne(ProductDescription, { foreignKey: 'product_id' });
Product.hasOne(ProductSpecification, { foreignKey: 'product_id' });
Product.hasMany(ProductImage, { foreignKey: 'product_id' });
Product.hasMany(ProductFaq, { foreignKey: 'product_id' });
Product.hasMany(ProductScreenshot, { foreignKey: 'product_id' });
Product.hasMany(ProductVideo, { foreignKey: 'product_id' });

// Associations for category selection logic
Product.belongsTo(ProductCategory, { foreignKey: 'product_id' });
ProductCategory.belongsTo(Category, { foreignKey: 'category_id' });

ProductFeature.belongsTo(Feature, {
  as: "featureMaster",
  foreignKey: "section_id",
  targetKey: "feature_id",
});


export const isVendorProduct = async (productId, brandArr) => {
  try {
    const count = await Product.count({
      where: {
        product_id: productId,
        brand_id: {
          [Op.in]: brandArr
        }
      }
    });

    return count > 0; // Returns true if found, false otherwise
  } catch (error) {
    console.error("Error in isVendorProduct service:", error);
    throw error;
  }
};

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

// get full brand details for product addition
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
    whereConditions.status = parseInt(search_filter.srch_status, 10);
  }

  const results = await Product.findAndCountAll({
    attributes: ['product_id', 'product_name', 'status', 'slug'],
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
        where: { default: 1 },
        required: false // LEFT JOIN
      }
    ],
    order: [[sortColumn, order]],
    limit: limitNum,
    offset: offset,
    raw: true,
    nest: true,
    logging:false
    // Emulate GROUP BY tp.product_id by taking unique products if needed
    // In practice, if there are multiple images, raw: true + nest: true might return multiple rows.
    // However, the original SQL had GROUP BY tp.product_id, usually to get a single image if any.
    // For many-to-many or many-to-one transformations like this, we usually flat them out.
  });

  // Flatten the result to match raw SQL output
  const flattenedResults = results.rows.map(row => ({
    product_id: row.product_id,
    product_name: row.product_name,
    slug: row.slug,
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

  // Return both count and data for pagination
  return {
    count: results.count,
    rows: flattenedResults
  };
};

export const getProductLeadsCount = async (productId) => {
  try {
    const count = await TblLeads.count({
      where: {
        product_id: productId
      }
    });
    return count;
  } catch (error) {
    console.error("Error in getProductLeadsCount service:", error);
    throw error;
  }
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


export const getSelectedCol = async ({
  table,
  columns = [],
  where = {},
  records = "single",
  order_by = null
}) => {
  try {
    
    let Model = sequelize.models[table];
    if (!Model) {
      Model = Object.values(sequelize.models).find(m => m.tableName === table);
    }

    if (!Model) {
      throw new Error(`[Database Error] Model or Table '${table}' is not registered in Sequelize.`);
    }

    const options = {
      attributes: columns.length > 0 ? columns : undefined,
      where: where && typeof where === 'object' ? where : {},
      raw: true,
    };

    if (order_by && typeof order_by === 'object' && Object.keys(order_by).length > 0) {
      options.order = Object.entries(order_by).map(([key, value]) => [key, value]);
    }

    if (records === "single") {
      return await Model.findOne(options);
    } 
    
    return await Model.findAll(options);

  } catch (error) {
    console.error(`getSelectedCol Error [Table: ${table}]:`, error.message);
    throw error;
  }
};




export const saveProduct = async (save, externalTransaction = null) => {
  const transaction = externalTransaction || await Product.sequelize.transaction();
  const ownsTransaction = !externalTransaction;
  try {
    const product = await Product.create(save, { transaction });
    if (ownsTransaction) await transaction.commit();
    return product.product_id;
  } catch (error) {
    if (ownsTransaction) await transaction.rollback();
    throw error;
  }
};


export const saveProductImage = async (productId, imageFiles, externalTransaction = null) => {
  if (!imageFiles || imageFiles.length === 0) return [];

  const transaction = externalTransaction || await ProductImage.sequelize.transaction();
  const ownsTransaction = !externalTransaction;
  const savedImages = [];

  try {
    for (const img of imageFiles) {
      // Sanitize original filename
      const originalName = img.originalname.replace(/[^a-zA-Z0-9._]+/g, "");
      const fileName = `${productId}_${originalName}`;
      const key = `web/assets/images/techjockey/products/${fileName}`;

      // Upload to S3
      const sanitizedImg = { ...img, originalname: originalName, key };
      const imageUrl = await uploadfile2(sanitizedImg);

      // Derive human-readable name (strip productId_ prefix and extension)
      const fileExt = fileName.substring(fileName.lastIndexOf("."));
      const humanReadableName = originalName.replace(fileExt, "");

      // Save record in DB
      const record = await ProductImage.create(
        {
          product_id: productId,
          image: fileName,
          image_name: humanReadableName,
        },
        { transaction }
      );

      savedImages.push({
        id: record.id,
        fileName,
        imageUrl,
      });
    }

    if (ownsTransaction) await transaction.commit();
    return savedImages;
  } catch (error) {
    if (ownsTransaction) await transaction.rollback();
    throw error;
  }
};


export const savePricingDocument = async (productId, documentFiles, externalTransaction = null) => {
  if (!documentFiles || documentFiles.length === 0) return [];

  const transaction = externalTransaction || await Product.sequelize.transaction();
  const ownsTransaction = !externalTransaction;
  const savedDocs = [];

  try {
    for (const doc of documentFiles) {
      const originalName = doc.originalname.replace(/[^a-zA-Z0-9._]+/g, "");
      const fileName = `${productId}_${originalName}`;
      const key = `web/assets/images/techjockey/products/pricing/${fileName}`;

      // Upload to S3
      const sanitizedDoc = { ...doc, originalname: originalName, key };
      const docUrl = await uploadfile2(sanitizedDoc);

      savedDocs.push({
        id: null,
        fileName,
        docUrl,
      });
    }

    if (savedDocs.length > 0) {
      await Product.update(
        { pricing_document: savedDocs[0].fileName },
        { where: { product_id: productId, is_deleted: 0 }, transaction }
      );
    }

    if (ownsTransaction) await transaction.commit();
    return savedDocs;
  } catch (error) {
    if (ownsTransaction) await transaction.rollback();
    throw error;
  }
};


// upload to s3 edit image files

export const uploadProductImageOnly = async (productId, imageFiles) => {
  if (!imageFiles || imageFiles.length === 0) return [];
  const savedImages = [];

  // Upload each image directly to S3 into a pending folder for later approval
  for (const img of imageFiles) {
    const originalName = img.originalname.replace(/[^a-zA-Z0-9._]+/g, "");
    const fileName = `${productId}_${originalName}`;
    const key = `web/assets/images/techjockey/products/${fileName}`;

    const sanitizedImg = { ...img, originalname: originalName, key };
    const imageUrl = await uploadfile2(sanitizedImg);

    savedImages.push({ fileName, s3Key: key, url: imageUrl });
  }

  return savedImages;
};

export const uploadPricingDocumentOnly = async (productId, documentFiles) => {
  if (!documentFiles || documentFiles.length === 0) return [];
  const savedDocs = [];

  // Upload pricing documents to S3 under pricing/pending for vendor edits
  for (const doc of documentFiles) {
    const originalName = doc.originalname.replace(/[^a-zA-Z0-9._]+/g, "");
    const fileName = `${productId}_${originalName}`;
    const key = `web/assets/images/techjockey/products/pricing/${fileName}`;

    const sanitizedDoc = { ...doc, originalname: originalName, key };
    const docUrl = await uploadfile2(sanitizedDoc);

    savedDocs.push({ fileName, s3Key: key, url: docUrl });
  }

  return savedDocs;
};

export const saveProductDescription = async (descriptionData, externalTransaction = null) => {
  const transaction = externalTransaction || await ProductDescription.sequelize.transaction();
  const ownsTransaction = !externalTransaction;

  try {
    const { product_id, brief, overview, description, internal_description } = descriptionData;

    const existingDesc = await ProductDescription.findOne({
      where: { product_id, is_deleted: 0 },
      transaction, 
    });

    if (existingDesc) {
      await ProductDescription.update(
        {
          brief: brief || existingDesc.brief,
          overview: overview || existingDesc.overview,
          description: description || existingDesc.description,
          internal_description: internal_description || existingDesc.internal_description,
          updated_at: new Date().toISOString(), // or new Date() if DATE type
        },
        {
          where: { product_id, is_deleted: 0 },
          transaction, 
        }
      );
    } else {
      await ProductDescription.create(
        {
          product_id,
          brief: brief || "",
          overview: overview || "",
          description: description || "",
          internal_description: internal_description || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          transaction, 
        }
      );
    }

    if (ownsTransaction) await transaction.commit(); 
  } catch (error) {
    if (ownsTransaction) await transaction.rollback(); 
    console.error("Error saving product description:", error);
    throw error;
  }
};

export const updateProductPricingDocument = async (productId, pricingDocument) => {
  const transaction = await Product.sequelize.transaction();
  try {
    await Product.update(
      { pricing_document: pricingDocument },
      { where: { product_id: productId, is_deleted: 0 }, transaction }
    );
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const logProductSaveToVendorLogs = async ({
  product_id,
  vendor_id,
  productData,
  imageFileName,
  documentFileName,
  categoryIds,
  descriptionData,
  isNewProduct = true,
  existingRecordIds = {},
  transaction: externalTransaction = null,
}) => {
  const transaction = externalTransaction || await VendorLog.sequelize.transaction();
  const ownsTransaction = !externalTransaction;
  try {
    const logRows = [];
    const now = new Date();
    
    // For new products: status=1, action=insert, p_key=""
    // For updates: status=0, action=updated, p_key="id"
    const status = isNewProduct ? 1 : 0;
    const action_performed = isNewProduct ? "insert" : "updated";
    
    const fieldsToLog = [
      // tbl_product fields
      { table: "tbl_product", column: "product_name", value: productData?.product_name },
      { table: "tbl_product", column: "brand_id", value: productData?.brand_id },
      { table: "tbl_product", column: "website_url", value: productData?.website_url },
      { table: "tbl_product", column: "trial_available", value: productData?.trial_available },
      { table: "tbl_product", column: "free_downld_available", value: productData?.free_downld_available },
      { table: "tbl_product", column: "pricing_document", value: documentFileName || productData?.pricing_document },
      { table: "tbl_product", column: "slug_id", value: productData?.slug_id },
    ];

    // Add description log if provided
    if (descriptionData?.overview) {
      fieldsToLog.push({
        table: "tbl_product_description",
        column: "overview",
        value: descriptionData.overview,
      });
    }

    // Add image log if provided
    if (imageFileName) {
      fieldsToLog.push({
        table: "tbl_product_image",
        column: "product_image",
        value: imageFileName,
      });
    }

    // Add category logs if provided
    if (categoryIds && Array.isArray(categoryIds)) {
      categoryIds.forEach((catId) => {
        fieldsToLog.push({
          table: "tbl_product_category",
          column: "category_id",
          value: catId,
        });
      });
    }

    // Create vendor log entries for each field
    for (const field of fieldsToLog) {
      if (field.value === undefined || field.value === null || field.value === "") continue;

      const p_key = isNewProduct ? "" : "id";
      const item_updated_id = isNewProduct ? 0 : (existingRecordIds[field.table] || 0);

      logRows.push({
        item_id: product_id,
        module: "product",
        action_performed,
        action_by: vendor_id,
        table_name: field.table,
        column_name: field.column,
        p_key,
        updated_column_value: field.value.toString(),
        linked_attribute: "",
        item_updated_id,
        reject_reason: "",
        status,
        created_at: now,
        updated_at: now,
      });
    }

    // Bulk insert all vendor logs
    if (logRows.length > 0) {
      await VendorLog.bulkCreate(logRows, { transaction });
    }

    if (ownsTransaction) await transaction.commit();
  } catch (error) {
    if (ownsTransaction) await transaction.rollback();
    console.error("Error logging product save to vendor_logs:", error);
    throw error;
  }
};

export const updateVendorLogs = async ({
  item_id,
  profile_id,
  module = "product",
  action_performed = "updated",
  status = 0,
  changes,
  externalTransaction = null,
}) => {
  const transaction = externalTransaction || (await VendorLog.sequelize.transaction());
  const ownsTransaction = !externalTransaction;
  const linked_attribute = Date.now().toString();

  try {
    const arrayTables = [
      "tbl_product_category",
      "tbl_product_image",
      "tbl_product_screenshots",
      "tbl_product_features",
      "tbl_product_specification",
      "tbl_description_gallery",
      "tbl_product_videos",
      "tbl_product_enrichment_images"
    ];
    for (const tbl of arrayTables) {
      if (changes.some((c) => c.table_name === tbl)) {
        await VendorLog.destroy({
          where: { item_id, module, status: 0, table_name: tbl },
          transaction,
        });
      }
    }

    for (const change of changes) {
      if (change.updated_column_value === undefined || change.updated_column_value === null) continue;

      const isArrayTable = arrayTables.includes(change.table_name);
      
      if (!isArrayTable) {
        const existingLog = await VendorLog.findOne({
          where: {
            item_id,
            module,
            status: 0,
            table_name: change.table_name,
            column_name: change.column_name,
            item_updated_id: change.item_updated_id || 0,
          },
          transaction,
        });

        if (existingLog) {
          await existingLog.update(
            {
              updated_column_value: change.updated_column_value.toString(),
              action_by: profile_id,
              linked_attribute,
              updated_at: new Date(),
            },
            { transaction }
          );
          continue;
        }
      }

      await VendorLog.create(
        {
          item_id,
          module,
          action_performed,
          action_by: profile_id,
          table_name: change.table_name,
          column_name: change.column_name,
          p_key: change.p_key || "id",
          updated_column_value: change.updated_column_value.toString(),
          linked_attribute: change.linked_attribute || linked_attribute,
          item_updated_id: change.item_updated_id || 0,
          reject_reason: "",
          status,
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction }
      );
    }

    if (ownsTransaction) await transaction.commit();
    return true;
  } catch (error) {
    if (ownsTransaction) await transaction.rollback();
    console.error("Error in updateVendorLogs:", error);
    throw error;
  }
};

const getActiveCategoryParentId = async (categoryId) => {
  const category = await Category.findOne({
    attributes: ["parent_id"],
    where: {
      category_id: categoryId,
      status: 1,
      show_status: 1,
      is_deleted: 0,
    },
    raw: true,
  });
  return category?.parent_id ?? null;
};

export const replaceProductCategories = async ({
  productId,
  categories,
  category_parent_id,
  transaction: externalTransaction = null,
}) => {
  const transaction = externalTransaction || await ProductCategory.sequelize.transaction();
  const ownsTransaction = !externalTransaction;
  try {
    await ProductCategory.destroy({ where: { product_id: productId }, transaction });

    const parentPayload = category_parent_id;

    for (let index = 0; index < categories.length; index++) {
      const categoryId = categories[index];
      if (!categoryId) continue;

      let parentId;
      let hasClientParent = false;

      if (category_parent_id !== undefined) {
        const raw = Array.isArray(parentPayload)
          ? parentPayload[index]
          : categories.length === 1
            ? parentPayload
            : index === 0
              ? parentPayload
              : undefined;

        if (raw !== undefined) {
          hasClientParent = true;
          parentId = raw === "" || raw === null ? null : parseInt(raw, 10);
          if (Number.isNaN(parentId)) parentId = null;
        }
      }

      if (!hasClientParent) {
        parentId = await getActiveCategoryParentId(categoryId);
        if (parentId === null) {
          console.warn(`Category ${categoryId} not found or inactive, skipping...`);
          continue;
        }
      }

      await ProductCategory.create({
        product_id: productId,
        parent_id: parentId,
        category_id: categoryId,
        sort_order: 0,
        is_primary: 1,
      }, { transaction });
    }

    if (ownsTransaction) await transaction.commit();
  } catch (error) {
    if (ownsTransaction) await transaction.rollback();
    throw error;
  }
};

export const startProductBasicDetailsTransaction = async () =>
  Product.sequelize.transaction();

//--------------This function will fetch the data of the existing product for editing purpose----------------

export const getProductDetail = async (product_id) => {
  try {
    // 1. Fetch main product data with basic associations
    const product = await Product.findOne({
      where: { product_id, is_deleted: 0 },
      include: [
        { model: ProductDescription, attributes: ['overview', 'description'] },
        { model: ProductSpecification },
        { model: ProductImage, attributes: ['image'] }
      ]
    });

    if (!product) return null;

    // 2. Fetch all secondary data in parallel for speed
    const [faqs, screenshots, videos, allOS, allIndustries, allBusiness] = await Promise.all([
      ProductFaq.findAll({ where: { product_id }, attributes: ['question', 'answer'], raw: true }),
      ProductScreenshot.findAll({ where: { product_id }, attributes: ['id', 'image'], raw: true }),
      ProductVideo.findAll({ where: { product_id }, attributes: ['id', 'video_url'], raw: true }),
      OperatingSystem.findAll({ raw: true }),
      ProductIndustry.findAll({ raw: true }),
      BusinessType.findAll({ raw: true })
    ]);

    // 3. Logic to handle comma-separated IDs (The "Developer way" to replace FIND_IN_SET)
    const spec = product.ProductSpecification || {};
    
    // Helper function to filter lookup tables based on comma-separated IDs in the spec
    const getNames = (ids, lookupTable, key, returnAttr) => {
      if (!ids) return "";
      const idArray = ids.split(',').map(Number);
      return lookupTable
        .filter(item => idArray.includes(item[key]))
        .map(item => item[returnAttr])
        .join(',');
    };

    // 4. Combine and return formatted data
    return {
      product_name: product.product_name,
      status: product.status,
      brand_id: product.brand_id,
      website_url: product.website_url,
      overview: product.ProductDescription?.overview,
      description: product.ProductDescription?.description,
      image: product.ProductImages?.[0]?.image || product.ProductImage?.image || null,
      
      // Specification Data
      industries: spec.industries,
      business: spec.business,
      deployment: spec.deployment,
      device: spec.device,
      operating_system: spec.operating_system,
      hw_configuration: spec.hw_configuration,
      sw_configuration: spec.sw_configuration,

      // Mapped Names (Replacing the raw SQL literals)
      operating_system_names: getNames(spec.operating_system, allOS, 'id', 'os_name'),
      operating_system_images: getNames(spec.operating_system, allOS, 'id', 'os_image'),
      industries_names: getNames(spec.industries, allIndustries, 'id', 'name'),
      business_names: getNames(spec.business, allBusiness, 'id', 'business_type_name'),

      // Related Lists
      faqs,
      screenshot: screenshots,
      videos
    };

  } catch (error) {
    console.error("Error in getProductDetail service:", error);
    throw error;
  }
};

export const geteditProductDetail = async (productId) => {
  try {

    const product = await Product.findOne({
      where: { product_id: productId, is_deleted: 0 },
      include: [
        { model: ProductDescription, attributes: ['id', 'overview'] }
      ],
      raw: true
    });

    if (!product) return null;

    // Fetch product image separately to avoid raw/nest issues with hasMany
    const productImage = await ProductImage.findOne({
      where: { product_id: productId, default: 1, status: 1 },
      attributes: ["image"],
      raw: true,
    });

    // Fetch categories with nested JOIN
    const categories = await ProductCategory.findAll({
      attributes: ['id'],
      where: { product_id: productId },
      include: [{
        model: Category,
        attributes: ['parent_id', 'category_id', 'category_name'],
        where: { status: 1, is_deleted: 0 },
        required: true
      }],
      nest: true,
      raw: true
    });

    // Map categories to match old flat output
    const formattedCategories = categories.map(c => ({
      id: c.id,
      parent_id: c.Category.parent_id,
      category_id: c.Category.category_id,
      category_name: c.Category.category_name
    }));

    return {
      product_id: product.product_id,
      product_name: product.product_name,
      brand_id: product.brand_id,
      website_url: product.website_url,
      trial_available: product.trial_available,
      free_downld_available: product.free_downld_available,
      pricing_document: product.pricing_document,
      image: productImage?.image || null,
      overview: product['ProductDescription.overview'] || null,
      arr_cat_selected: formattedCategories,
    };
  } catch (error) {
    console.error("Error in geteditProductDetail service:", error);
    throw error;
  }
};


const ORGANIZATION_TYPES = {
  1: "Small Business", 2: "Startups", 3: "Medium Business", 
  4: "Enterprises", 5: "SMBs", 6: "SMEs", 7: "MSMBs", 8: "MSMEs"
};

const DEPLOYMENTS = {
  1: "Cloud", 2: "Premise"
};

const OPERATING_SYSTEMS = {
  1: "Ubuntu", 2: "Windows", 3: "iOS", 4: "Android", 5: "MacOs", 6: "Windows Phone"
};

const DEVICES = {
  1: "Desktop", 2: "Mobile"
};

export const getProductSpecificationDetails = async (product_id) => {
  try {
    const spec = await ProductSpecification.findOne({
      where: { product_id: product_id }
    });

    if (!spec) return null;

    const data = spec.toJSON();

    // Helper to map comma-separated ID strings to Array of Objects { id, name }
    const mapValues = (csv, dictionary) => {
      if (!csv) return [];
      return csv.split(",").map(id => ({
        id: id.trim(),
        name: dictionary[id.trim()] || "Unknown"
      }));
    };

    // Attach parsed objects to response so frontend can easily render them
    return {
      ...data,
      organization_type_details: mapValues(data.organization_type, ORGANIZATION_TYPES),
      deployment_details: mapValues(data.deployment, DEPLOYMENTS),
      operating_system_details: mapValues(data.operating_system, OPERATING_SYSTEMS),
      device_details: mapValues(data.device, DEVICES)
    };
  } catch (error) {
    console.error("Error fetching product specification:", error);
    throw error;
  }
};

export const getLanguageList = async () => {
  try {
    const languages = await Language.findAll({
      attributes: ['id', 'language', 'display_language'],
      order: [['language', 'ASC']] 
    });

    return languages;
  } catch (error) {
    console.error("Error fetching language list:", error);
    throw error;
  }
};

const defaultCols = {
  size: "16-200",
  industries: "",
  business: "",
  customer_support: "",
  integrations: "",
  ai_features: "",
  technology: 0,
  third_party_integration: "",
  property_type: "",
  training: "5",
  compliance_regulation: "",
  hw_configuration: "",
  sw_configuration: "",
  
};

const createProductSpecificationVendorLogs = async ({
  product_id,
  vendor_id,
  action_performed,
  fields,
  item_updated_id = 0,
  transaction = null,
}) => {
  const logRows = [];
  const p_key = "id"; // Always use 'id' as p_key for specification table updates

  for (const [column_name, value] of Object.entries(fields)) {
    // Note: We log the value even if it's an empty string (meaning the field was cleared)
    // but skip if it's undefined or null
    if (value === undefined || value === null) continue;

    logRows.push({
      item_id: product_id,
      module: "product",
      action_performed,
      action_by: vendor_id,
      table_name: "tbl_product_specification",
      column_name,
      p_key,
      updated_column_value: value.toString(),
      linked_attribute: "",
      item_updated_id,
      reject_reason: "",
      status: 0, // Pending approval
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  if (logRows.length) {
    await VendorLog.bulkCreate(logRows, { transaction });
  }

  return logRows;
};

export const saveOrUpdateProductSpecification = async (
  id,
  productData,
  vendor_id,
) => {
  const transaction = await VendorLog.sequelize.transaction();
  try {
    const product_id = productData.product_id;

    // 1. Fetch current specification from database to find differences
    const existingSpec = await ProductSpecification.findOne({
      where: { product_id },
      raw: true
    });

    // 2. Define fields to compare (matching the PHP logic)
    const trackingFields = [
      'deployment',
      'device',
      'operating_system',
      'organization_type',
      'languages'
    ];

    const fieldsToLog = {};
    const item_updated_id = existingSpec ? existingSpec.id : 0;

    // Helper to normalize CSV strings (removes spaces, ensures consistent format)
    const normalize = (val) => 
      String(val || "")
        .split(",")
        .map(v => v.trim())
        .filter(Boolean)
        .join(",");

    // 3. Find only changed fields: compare incoming data with actual record
    trackingFields.forEach(field => {
      const newValue = normalize(productData[field]);
      const oldValue = normalize(existingSpec ? existingSpec[field] : "");

      // Check if value is different after normalization
      if (newValue !== oldValue) {
        fieldsToLog[field] = newValue;
      }
    });

    // 4. If no changes detected, don't create any logs
    if (Object.keys(fieldsToLog).length === 0) {
      await transaction.commit();
      return {
        message: "No changes detected, nothing to update.",
        logs_created: 0,
        item_id: product_id
      };
    }

    // 5. Log only the changed fields
    const action_performed = "updated";
    const logs = await createProductSpecificationVendorLogs({
      product_id,
      vendor_id,
      action_performed,
      fields: fieldsToLog,
      item_updated_id,
      transaction,
    });

    await transaction.commit();
    return {
      action: action_performed,
      item_id: product_id,
      item_updated_id,
      logs_created: logs.length,
      changed_fields: Object.keys(fieldsToLog),
    };
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error in saveOrUpdateProductSpecification:", error);
    throw error;
  }
};




export const getProductFeatures = async (product_id) => {
  try {
    const productFeatures = await ProductFeature.findAll({
      where: {
        product_id: product_id,
        status: 1,      // Approved features only
        is_deleted: 0   // Non-deleted features
      },
      include: [
        {
          model: Feature,
          as: "featureMaster",
          attributes: ["feature_name"],
        },
      ],
      order: [['sort_order', 'ASC']]
    });

    // Format the response to include feature_name at the top level if needed, 
    // or just return the records with nested include.
    return productFeatures;
  } catch (error) {
    console.error("Error in getProductFeatures service:", error);
    throw error;
  }
};

export const getAllFeatures = async (search = null) => {
  try {
    const whereCondition = {
      status: 1,
      is_deleted: 0
    };

    // Add search filter if provided
    if (search && search.trim()) {
      whereCondition.feature_name = { [Op.like]: `%${search.trim()}%` };
    }

    const features = await Feature.findAll({
      attributes: ['feature_id', 'feature_name'],
      where: whereCondition,
      order: [['feature_name', 'ASC']]
    });

    return features;
  } catch (error) {
    console.error("Error fetching feature list:", error);
    throw error;
  }
};

export const saveOrUpdateProductFeature = async (id, post, vendor_id) => {
  const transaction = await VendorLog.sequelize.transaction();
  try {
    const productId = post.product_id;
    const section_id = post.section_id;
    const fieldsToTrack = {
      section_id: section_id,
      description: post.description || "",
      feature_display_name: post.feature_display_name || "",
    };

    if (id) {
      // 1. EDIT EXISTING: Find only changed fields
      const existing = await ProductFeature.findOne({
        where: { id: id, product_id: productId },
        raw: true,
      });

      if (!existing) {
        throw new Error("Product feature not found");
      }

      const changes = [];
      for (const [key, newValue] of Object.entries(fieldsToTrack)) {
        if (String(newValue) !== String(existing[key] || "")) {
          changes.push({
            table_name: "tbl_product_features",
            column_name: key,
            updated_column_value: newValue,
            p_key: "id",
            item_updated_id: id,
          });
        }
      }

      if (changes.length === 0) {
        await transaction.commit();
        return { action: "none", message: "No changes detected" };
      }

      // Save to VendorLog (updateVendorLogs handles dedupe if status=0 exists)
      await updateVendorLogs({
        item_id: productId,
        profile_id: vendor_id,
        module: "product",
        action_performed: "updated",
        changes,
        externalTransaction: transaction,
      });

      await transaction.commit();
      return { action: "update", id };
    } else {
      // 2. NEW FEATURE: Check for duplicate approved feature
      const duplicate = await ProductFeature.findOne({
        where: {
          product_id: productId,
          section_id: section_id,
          status: 1,
          is_deleted: 0,
        },
      });

      if (duplicate) {
        throw new Error("This feature is already added to this product.");
      }

      const changes = Object.entries(fieldsToTrack).map(([key, value]) => ({
        table_name: "tbl_product_features",
        column_name: key,
        updated_column_value: value,
        p_key: "id",
        item_updated_id: 0,
      }));

      await updateVendorLogs({
        item_id: productId,
        profile_id: vendor_id,
        module: "product",
        action_performed: "updated",
        changes,
        externalTransaction: transaction,
      });

      await transaction.commit();
      return { action: "insert", id: 0 };
    }
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error in saveOrUpdateProductFeature (service):", error);
    throw error;
  }
};


export const getProductScreenshots = async (product_id) => {
  try {
    const screenshots = await ProductScreenshot.findAll({
      where: {
        product_id: product_id,
        status: 1,
        is_deleted: 0
      },
      order: [['sort_order', 'ASC']]
    });
    return screenshots;
  } catch (error) {
    console.error("Error in getProductScreenshots service:", error);
    throw error;
  }
};

export const logProductScreenshotsRequest = async ({
  productId,
  vendor_id,
  screenshotsData
}) => {
  const transaction = await VendorLog.sequelize.transaction();
  try {
    const changes = [];
    
    // 1. Fetch existing screenshots for comparison
    const existingScreenshots = await ProductScreenshot.findAll({
      where: { product_id: productId, status: 1, is_deleted: 0 },
      raw: true
    });

    const processedIds = new Set();
    let loopIndex = 0;
    for (const data of screenshotsData) {
      let { id, alt_text, image } = data;
      const groupLinkedAttr = Date.now().toString() + (loopIndex++);
      
      // Ensure id is treated as null if it's "0" or invalid
      if (id === "0" || id === 0 || id === "") id = null;

      if (id && !processedIds.has(String(id))) {
        processedIds.add(String(id));
        // UPDATE case: Compare with existing row
        const existing = existingScreenshots.find(s => s.id == id);
        if (existing) {
          // Compare img_alt
          if (String(alt_text) !== String(existing.img_alt || "")) {
            changes.push({
              table_name: "tbl_product_screenshots",
              column_name: "img_alt",
              updated_column_value: alt_text,
              p_key: "id",
              item_updated_id: id,
              linked_attribute: groupLinkedAttr
            });
          }
          // Compare image
          if (image && String(image) !== String(existing.image || "")) {
            changes.push({
              table_name: "tbl_product_screenshots",
              column_name: "image",
              updated_column_value: image,
              p_key: "id",
              item_updated_id: id,
              linked_attribute: groupLinkedAttr
            });
          }
        }
      } else if (image || alt_text) {
        // INSERT case: Create insert-style logs (item_updated_id: 0)
        changes.push({
          table_name: "tbl_product_screenshots",
          column_name: "img_alt",
          updated_column_value: alt_text || "",
          p_key: "id",
          item_updated_id: 0,
          linked_attribute: groupLinkedAttr
        });
        if (image) {
          changes.push({
            table_name: "tbl_product_screenshots",
            column_name: "image",
            updated_column_value: image,
            p_key: "id",
            item_updated_id: 0,
            linked_attribute: groupLinkedAttr
          });
        }
      }
    }

    if (changes.length === 0) {
      await transaction.commit();
      return { action: "none", message: "No changes detected" };
    }

    // 2. Save to VendorLog
    await updateVendorLogs({
      item_id: productId,
      profile_id: vendor_id,
      module: "product",
      action_performed: "updated",
      changes,
      externalTransaction: transaction
    });

    await transaction.commit();
    return { action: "logged", count: changes.length };
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error in logProductScreenshotsRequest:", error);
    throw error;
  }
};



export const logProductGalleryRequest = async ({
  productId,
  vendor_id,
  galleryData
}) => {
  const transaction = await VendorLog.sequelize.transaction();
  try {
    const changes = [];
    
    // Fetch existing gallery items for comparison
    const existingGallery = await DescriptionGallery.findAll({
      where: { product_id: productId, is_deleted: 0 },
      raw: true
    });

    const processedIds = new Set();
    let loopIndex = 0;
    for (const data of galleryData) {
      let { id, title, description, image } = data;
      const groupLinkedAttr = Date.now().toString() + (loopIndex++);
      
      // Ensure id is treated as null if it's "0" or invalid
      if (id === "0" || id === 0 || id === "") id = null;

      if (id && !processedIds.has(String(id))) {
        processedIds.add(String(id));
        // UPDATE case: Compare with existing row
        const existing = existingGallery.find(g => String(g.id) === String(id));
        if (existing) {
          // Compare gallery_title
          if (String(title || "") !== String(existing.title || "")) {
            changes.push({
              table_name: "tbl_description_gallery",
              column_name: "title",
              updated_column_value: title,
              p_key: "id",
              item_updated_id: id,
              linked_attribute: groupLinkedAttr
            });
          }
          // Compare gallery_description
          if (String(description || "") !== String(existing.description || "")) {
            changes.push({
              table_name: "tbl_description_gallery",
              column_name: "description",
              updated_column_value: description,
              p_key: "id",
              item_updated_id: id,
              linked_attribute: groupLinkedAttr
            });
          }
          // Compare gallery_image
          if (image && String(image) !== String(existing.image || "")) {
            changes.push({
              table_name: "tbl_description_gallery",
              column_name: "image",
              updated_column_value: image,
              p_key: "id",
              item_updated_id: id,
              linked_attribute: groupLinkedAttr
            });
          }
        }
      } else if (title || description || image) {
        // INSERT case: Create insert-style logs (item_updated_id: 0)
        changes.push({
          table_name: "tbl_description_gallery",
          column_name: "gallery_title",
          updated_column_value: title || "",
          p_key: "id",
          item_updated_id: 0,
          linked_attribute: groupLinkedAttr
        });
        changes.push({
          table_name: "tbl_description_gallery",
          column_name: "gallery_description",
          updated_column_value: description || "",
          p_key: "id",
          item_updated_id: 0,
          linked_attribute: groupLinkedAttr
        });
        if (image) {
          changes.push({
            table_name: "tbl_description_gallery",
            column_name: "gallery_image",
            updated_column_value: image,
            p_key: "id",
            item_updated_id: 0,
            linked_attribute: groupLinkedAttr
          });
        }
      }
    }

    if (changes.length === 0) {
      await transaction.commit();
      return { action: "none", message: "No changes detected" };
    }

    // Save to VendorLog
    await updateVendorLogs({
      item_id: productId,
      profile_id: vendor_id,
      module: "product",
      action_performed: "updated",
      changes,
      externalTransaction: transaction
    });

    await transaction.commit();
    return { action: "logged", count: changes.length };
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error in logProductGalleryRequest:", error);
    throw error;
  }
};
export const addGalleryModel = async (filesData, product_id) => {
  const transaction = await DescriptionGallery.sequelize.transaction();
  try {
    const galleryData = [];

    for (const item of filesData) {
      // Prepare the data object
      const dataPayload = {
        image: item.image,
        img_alt: item.img_alt || null,
        title: item.title,
        description: item.description,
        product_id: product_id,
        status: item.status ?? 1, // Default to 1 if not provided
        is_deleted: item.is_deleted ?? 0,
      };

      if (item.id) {
        // --- Update existing record ---
        await DescriptionGallery.update(dataPayload, {
          where: { id: item.id },
          transaction,
        });

        galleryData.push({ ...dataPayload, id: item.id });
      } else {
        // --- Insert new record ---
        const newRecord = await DescriptionGallery.create(dataPayload, { transaction });

        galleryData.push(newRecord.get({ plain: true }));
      }
    }

    await transaction.commit();
    return galleryData;
  } catch (error) {
    await transaction.rollback();
    console.error("Error in addGalleryModel:", error);
    throw error;
  }
};

export const getGalleryImages = async (product_id) => {
  try {
    const gallery = await DescriptionGallery.findAll({
      where: { product_id: product_id, is_deleted: 0 },
      raw: true,
      order: [["id", "ASC"]],
    });
    return gallery;
  } catch (error) {
    console.error("Error in getGalleryImages service:", error);
    throw error;
  }
};


export const upsertEnrichmentImages = async (enrichmentData) => {
  const transaction = await ProductEnrichmentImage.sequelize.transaction();
  try {
    const saved = [];

    for (const item of enrichmentData) {
      if (item.id) {
        //  UPDATE
        await ProductEnrichmentImage.update(
          {
            type: item.type,
            image_width: item.image_width,
            image_height: item.image_height,
            image: item.image,
            product_id: item.product_id,
          },
          {
            where: { id: item.id },
            transaction,
          }
        );

        saved.push(item);
      } else {
        // INSERT
        const newRecord = await ProductEnrichmentImage.create({
          type: item.type,
          image_width: item.image_width,
          image_height: item.image_height,
          image: item.image,
          product_id: item.product_id,
        }, { transaction });

        saved.push(newRecord.get({ plain: true }));
      }
    }

    await transaction.commit();
    return saved;
  } catch (error) {
    await transaction.rollback();
    console.error("Error in upsertEnrichmentImages:", error);
    throw error;
  }
};

/**
 * Fetch enrichment images and compute budget math for parity with legacy PHP.
 */
export const getProductEnrichmentImages = async (productId) => {
  try {
    const images = await ProductEnrichmentImage.findAll({
      where: { product_id: productId },
      raw: true
    });

    const desktop_enrichment_images = images.filter(i => i.type == 1);
    const mobile_enrichment_images = images.filter(i => i.type == 2);

    const image_height_mapping = {};
    images.forEach(img => {
      image_height_mapping[img.id] = img.image_height;
    });

    // Budget math
    let desktop_remaining_height = 2400;
    desktop_enrichment_images.forEach(img => {
      desktop_remaining_height -= (img.image_height || 0);
    });

    let mobile_remaining_height = 4000;
    mobile_enrichment_images.forEach(img => {
      mobile_remaining_height -= (img.image_height || 0);
    });

    return {
      desktop_enrichment_images,
      mobile_enrichment_images,
      image_height_mapping,
      desktop_remaining_height,
      mobile_remaining_height,
      desktop_max_width: 1260,
      mobile_max_width: 600
    };
  } catch (error) {
    console.error("Error in getProductEnrichmentImages:", error);
    throw error;
  }
};

/**
 * Handle enrichment approval workflow via vendor_logs.
 */
export const logProductEnrichmentRequest = async ({
  productId,
  vendor_id,
  enrichmentData
}) => {
  const transaction = await VendorLog.sequelize.transaction();
  try {
    const changes = [];
    
    // 1. Fetch existing enrichment for comparison
    const existingImages = await ProductEnrichmentImage.findAll({
      where: { product_id: productId},
      raw: true
    });

    let loopIndex = 0;
    for (const data of enrichmentData) {
      let { id, type, image_width, image_height, image } = data;
      const groupLinkedAttr = Date.now().toString() + (loopIndex++);
      
      // Ensure id is treated as null if it's "0" or invalid
      if (id === "0" || id === 0 || id === "") id = null;

      if (id) {
        // UPDATE case: Compare with existing row
        const existing = existingImages.find(img => String(img.id) === String(id));
        if (existing) {
          // Compare image
          if (image && String(image) !== String(existing.image || "")) {
            changes.push({
              table_name: "tbl_product_enrichment_images",
              column_name: "image",
              updated_column_value: image,
              p_key: "id",
              item_updated_id: id,
              linked_attribute: groupLinkedAttr
            });
            // Legacy also logs type even if unchanged
            changes.push({
              table_name: "tbl_product_enrichment_images",
              column_name: "type",
              updated_column_value: type,
              p_key: "id",
              item_updated_id: id,
              linked_attribute: groupLinkedAttr
            });
          }
        }
      } else if (image) {
        // INSERT case: Create insert-style logs (item_updated_id: 0)
        changes.push({
          table_name: "tbl_product_enrichment_images",
          column_name: "enrichment_image",
          updated_column_value: image,
          p_key: "id",
          item_updated_id: 0,
          linked_attribute: groupLinkedAttr
        });
        changes.push({
          table_name: "tbl_product_enrichment_images",
          column_name: "type",
          updated_column_value: type,
          p_key: "id",
          item_updated_id: 0,
          linked_attribute: groupLinkedAttr
        });
      }
    }

    if (changes.length === 0) {
      await transaction.commit();
      return { action: "none", message: "No changes detected" };
    }

    // 2. Save to VendorLog
    await updateVendorLogs({
      item_id: productId,
      profile_id: vendor_id,
      module: "product",
      action_performed: "updated",
      changes,
      externalTransaction: transaction
    });

    await transaction.commit();
    return { action: "logged", count: changes.length };
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error in logProductEnrichmentRequest:", error);
    throw error;
  }
};


export const addVideoModel = async (videos) => {
  const transaction = await ProductVideo.sequelize.transaction();
  try {
    if (!videos || videos.length === 0) {
      await transaction.commit();
      return [];
    }

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
      updated_at: item.id ? new Date() : null, 
      created_at: item.id ? undefined : new Date() 
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
        "updated_at" 
      ],
      transaction,
    });

    // Return the original formatted data with IDs from the result
    // This ensures correct timestamps in the response
    const response = formattedVideos.map((item, index) => ({
      ...item,
      id: result[index]?.id || item.id, // Get the ID from the result if it was inserted
      created_at: item.created_at, 
      updated_at: item.updated_at  
    }));
    await transaction.commit();
    return response;

  } catch (error) {
    await transaction.rollback();
    console.error("Error in addVideoModel:", error);
    throw error;
  }
};

/**
 * Fetch existing product videos (ordered by ID)
 */
export const getProductVideos = async (productId) => {
  try {
    return await ProductVideo.findAll({
      where: { product_id: productId, is_deleted: 0 },
      attributes: ["id", "video_url", "video_title"],
      order: [["id", "ASC"]],
      raw: true
    });
  } catch (error) {
    console.error("Error in getProductVideos service:", error);
    throw error;
  }
};

/**
 * Handle video approval workflow via vendor_logs (Legacy PHP parity)
 */
export const logProductVideoRequest = async ({
  productId,
  vendor_id,
  videoData
}) => {
  const transaction = await VendorLog.sequelize.transaction();
  try {
    const changes = [];
    
    // 1. Fetch existing videos for comparison (ordered to match index)
    const existingRows = await ProductVideo.findAll({
      where: { product_id: productId, is_deleted: 0 },
      order: [["id", "ASC"]],
      raw: true
    });

    let loopIndex = 0;
    for (const data of videoData) {
      let { id, video_url, video_title } = data;
      // Use a robust unique attribute per video slot
      const groupLinkedAttr = `${Date.now()}_${Math.floor(Math.random() * 1000)}_${loopIndex}`;
      
      // Keep it numeric (0) for new items to avoid DB schema errors
      const logItemId = (id && id !== "0") ? id : 0;

      if (id && id !== "0") {
        // UPDATE Case
        const existing = existingRows.find(v => String(v.id) === String(id));
        
        if (existing) {
          const isTitleChanged = String(video_title || "") !== String(existing.video_title || "");
          const isUrlChanged = String(video_url || "") !== String(existing.video_url || "");

          if (isTitleChanged || isUrlChanged) {
            changes.push({
              table_name: "tbl_product_videos",
              column_name: "video_title",
              updated_column_value: video_title || "",
              p_key: "id",
              item_updated_id: logItemId,
              linked_attribute: groupLinkedAttr
            });
            changes.push({
              table_name: "tbl_product_videos",
              column_name: "video_url",
              updated_column_value: video_url || "",
              p_key: "id",
              item_updated_id: logItemId,
              linked_attribute: groupLinkedAttr
            });
          }
        }
      } else if (video_url) {
        // INSERT Case
        changes.push({
          table_name: "tbl_product_videos",
          column_name: "video_title",
          updated_column_value: video_title || "",
          p_key: "id",
          item_updated_id: logItemId,
          linked_attribute: groupLinkedAttr
        });
        changes.push({
          table_name: "tbl_product_videos",
          column_name: "video_url",
          updated_column_value: video_url || "",
          p_key: "id",
          item_updated_id: logItemId,
          linked_attribute: groupLinkedAttr
        });
      }
      loopIndex++;
    }

    if (changes.length === 0) {
      await transaction.commit();
      return { action: "none" };
    }

    // 2. Save to VendorLog
    await updateVendorLogs({
      item_id: productId,
      profile_id: vendor_id,
      module: "product",
      action_performed: "updated",
      changes,
      externalTransaction: transaction
    });

    await transaction.commit();
    return { action: "logged", changes };
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error in logProductVideoRequest:", error);
    throw error;
  }
};