import sequelize from "../../db/connection.js";
import { uploadfile2 } from "../../utilis/s3Uploader.js";
import sizeOf from "image-size";
import { Op } from "sequelize";
import VendorBrandRelation from "../../models/vendorBrandRelation.model.js";
import Brand from "../../models/brand.model.js";
import TblLeads from "../../models/leads.model.js";
import Product from "../../models/product.model.js";
import ProductImage from "../../models/productImage.model.js";
import Category from "../../models/category.model.js";
import ProductSpecification from "../../models/productSpecification.model.js";
import VendorLog from "../../models/vendorLog.model.js";
import Language from "../../models/languages.model.js";
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


// ---------------------------------------- Get Product List ----------------------------

export const getProductList = async (
  brand_arr,
  search_filter = {},
  order_by = "tp.product_id",
  order = "desc",
  limit,
  pageNumber,
  vendor_id = null
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
      },
    ],
    order: [[sortColumn, order]],
    limit: limitNum,
    offset: offset,
    raw: true,
    nest: true,
    logging: false
    // Emulate GROUP BY tp.product_id by taking unique products if needed
    // In practice, if there are multiple images, raw: true + nest: true might return multiple rows.
    // However, the original SQL had GROUP BY tp.product_id, usually to get a single image if any.
    // For many-to-many or many-to-one transformations like this, we usually flat them out.
  });

  // Flatten the result to match raw SQL output
  let flattenedResults = results.rows.map(row => ({
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

  // Attach leads_count for each product by querying TblLeads grouped by product_id
  try {
    const productIds = flattenedResults.map(r => r.product_id).filter(Boolean);
    if (productIds.length > 0) {
      // Count leads with visibility/trashed constraints and optional vendor filter
      const leadsWhere = {
        product_id: { [Op.in]: productIds },
        [Op.or]: [
          { lead_visibility: 1 },
          { [Op.and]: [{ lead_visibility: 0 }, { is_trashed: 1 }] }
        ]
      };

      if (vendor_id) {
        leadsWhere.vendor_id = vendor_id;
      }

      const leads = await TblLeads.findAll({
        attributes: ['product_id', [sequelize.fn('COUNT', sequelize.col('id')), 'leads_count']],
        where: leadsWhere,
        group: ['product_id'],
        raw: true,
      });

      const leadMap = new Map(leads.map(l => [l.product_id, Number(l.leads_count) || 0]));
      flattenedResults = flattenedResults.map(r => ({ ...r, leads_count: leadMap.get(r.product_id) || 0 }));
    }
  } catch (err) {
    console.error('Error fetching leads counts for products:', err);
    // Do not fail the whole request — return products without leads_count if query fails
  }

  // Return both count and data for pagination
  return {
    count: results.count,
    rows: flattenedResults
  };
};

export const getVendorProductsCount = async (brand_arr, srch_product_name = "") => {
  if (!brand_arr || brand_arr.length === 0) {
    return { all: 0, active: 0, inactive: 0 };
  }

  const whereConditions = {
    is_deleted: 0,
    brand_id: { [Op.in]: brand_arr },
  };

  if (srch_product_name) {
    whereConditions.product_name = { [Op.like]: `%${srch_product_name}%` };
  }

  const rows = await Product.findAll({
    attributes: [
      "status",
      [sequelize.fn("COUNT", sequelize.col("product_id")), "count"],
    ],
    where: whereConditions,
    group: ["status"],
    raw: true,
  });

  const counts = { all: 0, active: 0, inactive: 0 };
  for (const row of rows) {
    const n = Number(row.count) || 0;
    counts.all += n;
    if (row.status === 1) counts.active += n;
    else counts.inactive += n;
  }

  return counts;
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

// ---------------------------------------- Get Category List ----------------------------

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

  // Upload pricing documents to S3  under pricing/pending for vendor edits
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

    // Validation: DB columns are VARCHAR(255) - enforce max length
    const MAX_LEN = 255;
    const tooLongField = (name, value) => typeof value === 'string' && value.length > MAX_LEN ? name : null;
    const violations = [
      tooLongField('brief', brief),
      tooLongField('overview', overview),
      tooLongField('description', description),
      tooLongField('internal_description', internal_description),
    ].filter(Boolean);

    if (violations.length > 0) {
      throw new Error(`Product description fields exceed maximum length ${MAX_LEN}: ${violations.join(', ')}`);
    }

    const existingDesc = await ProductDescription.findOne({
      where: { product_id },
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
          where: { product_id },
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

    // Validate lengths for vendor_logs (updated_column_value is VARCHAR(255))
    const MAX_LOG_LEN = 255;
    const tooLong = fieldsToLog
      .filter(f => f.value !== undefined && f.value !== null && String(f.value).length > MAX_LOG_LEN)
      .map(f => `${f.table}.${f.column}`);

    if (tooLong.length > 0) {
      throw new Error(`Vendor log fields exceed maximum length ${MAX_LOG_LEN}: ${tooLong.join(', ')}`);
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
        updated_column_value: String(field.value).toString(),
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

export const saveOrUpdateProductBasicDetails = async (
  vendor_id,
  post = {},
  files = {},
  product_id = null
) => {
  const isNewProduct = !product_id;
  const transaction = await startProductBasicDetailsTransaction();
  try {
    // Build save object (preserve exact defaults as controller)
    const save = {
      product_name: post?.product_name ?? "",
      brand_id: post?.brand_id ?? "",
      website_url: post?.website_url ?? "",
      trial_available: post?.trial_available ?? 0,
      free_downld_available: post?.free_downld_available ?? "",
      status: 0,
      date_added: new Date(),
      added_by: "vendor",
      added_by_id: vendor_id ?? "",
      product_code: post?.product_code ?? "TP01",
      similar_product: post?.similar_product ?? "",
      price: post?.price || 10.2,
      special_price: post?.special_price || 200,
      duration: post?.duration || 0,
      duration_mode: post?.duration_mode ?? "",
      discount: post?.discount || 10.2,
      price_text: post?.price_text || "varun",
      brochure: post?.brochure ?? "",
      slug: post?.slug ?? "",
      search_keyword: post?.search_keyword ?? "",
      page_title: post?.page_title ?? "",
      meta_title: post?.meta_title ?? "",
      page_keyword: post?.page_keyword ?? "",
      page_description: post?.page_description ?? "",
      cano_url: post?.cano_url ?? "",
      featured_start_date: post?.featured_start_date ?? new Date(),
      featured_end_date: post?.featured_end_date ?? new Date(),
      downld_file_path: post?.downld_file_path ?? "",
      trial_duration: post?.trial_duration ?? "0",
      trial_duration_in: post?.trial_duration_in ?? "",
      free_downld_path: post?.free_downld_path || 0,
      show_in_peripherals: post?.show_in_peripherals ?? "0",
      price_type: post?.price_type ?? "1",
      commission_type: post?.commission_type ?? "1",
      commission: post?.commission ?? "4",
      tp_comment: post?.tp_comment ?? "",
      discount_factor: post?.discount_factor ?? "0",
      discount_value: post?.discount_value ?? "2",
      rebate: post?.rebate ?? "",
      renewable_term: post?.renewable_term ?? "",
      custom_search_order: post?.custom_search_order ?? "0",
      recommended: post?.recommended ?? "22",
      manual_reviews: post?.manual_reviews ?? "1",
    };

    // Slug ID generation
    const maxSlug = await getSelectedCol({
      table: "Setting",
      columns: ["setting_value"],
      where: { var_name: "MAX_SLUG_ID" },
    });
    save.slug_id = parseInt(maxSlug?.setting_value || 0) + 1;

    let productId = product_id;
    let uploadedImages = [];
    let uploadedDocuments = [];

    if (isNewProduct) {
      // Save product
      productId = await saveProduct(save, transaction);

      // Images
      if (files?.image) {
        uploadedImages = await saveProductImage(productId, files.image, transaction);
      }

      // Documents
      if (files?.documents) {
        uploadedDocuments = await savePricingDocument(productId, files.documents, transaction);
      }

      // Description
      if (post?.brief || post?.overview || post?.description || post?.internal_description) {
        await saveProductDescription({
          product_id: productId,
          brief: post?.brief ?? "",
          overview: post?.overview ?? "",
          description: post?.description ?? "",
          internal_description: post?.internal_description ?? "",
        }, transaction);
      }

      // Categories
      if (post?.product_category) {
        const categories = Array.isArray(post.product_category)
          ? post.product_category
          : [post.product_category];

        await replaceProductCategories({
          productId,
          categories,
          category_parent_id: post.category_parent_id,
          transaction,
        });
      }
    }

    // Log to vendor_logs
    const descriptionForLog = post?.brief || post?.overview ? { overview: post?.overview ?? "" } : null;
    const categoryIds = Array.isArray(post?.product_category)
      ? post.product_category
      : post?.product_category
        ? [post.product_category]
        : [];

    await logProductSaveToVendorLogs({
      product_id: productId,
      vendor_id,
      productData: save,
      imageFileName: uploadedImages[0]?.fileName || null,
      documentFileName: uploadedDocuments[0]?.fileName || null,
      categoryIds,
      descriptionData: descriptionForLog,
      isNewProduct,
      existingRecordIds: {},
      transaction,
    });

    await transaction.commit();

    return {
      product_id: productId,
      images: uploadedImages,
      documents: uploadedDocuments,
    };
  } catch (err) {
    if (transaction) await transaction.rollback();
    throw err;
  }
};

export const updateProductBasicDetails = async (vendor_id, product_id, post, files) => {
  const existing = await geteditProductDetail(product_id);
  if (!existing) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  let transaction = await startProductBasicDetailsTransaction();
  try {
    let uploadedImages = [];
    let uploadedDocuments = [];

    if (files?.image) {
      uploadedImages = await uploadProductImageOnly(product_id, files.image);
    }

    if (files?.documents) {
      uploadedDocuments = await uploadPricingDocumentOnly(product_id, files.documents);
    }

    const changes = [];

    const tpFields = [
      { key: "product_name", orig: existing.product_name },
      { key: "brand_id", orig: existing.brand_id },
      { key: "website_url", orig: existing.website_url },
      { key: "trial_available", orig: existing.trial_available },
      { key: "free_downld_available", orig: existing.free_downld_available }
    ];

    tpFields.forEach(f => {
      if (post[f.key] !== undefined && post[f.key] != f.orig) {
        changes.push({
          table_name: "tbl_product",
          column_name: f.key,
          updated_column_value: post[f.key],
          p_key: "product_id",
          item_updated_id: product_id
        });
      }
    });

    if (uploadedDocuments.length > 0) {
      changes.push({
        table_name: "tbl_product",
        column_name: "pricing_document",
        updated_column_value: uploadedDocuments[0].fileName,
        p_key: "product_id",
        item_updated_id: product_id
      });
    }

    if (uploadedImages.length > 0) {
      const existingImage = await getSelectedCol({
        table: "ProductImage",
        columns: ["image_id"],
        where: { product_id }
      });
      changes.push({
        table_name: "tbl_product_image",
        column_name: "product_image",
        updated_column_value: uploadedImages[0].fileName,
        p_key: "image_id",
        item_updated_id: existingImage ? existingImage.id : 0
      });
    }

    if (post.overview !== undefined && post.overview != existing.overview) {
      const existingDesc = await getSelectedCol({
        table: "ProductDescription",
        columns: ["id"],
        where: { product_id }
      });
      changes.push({
        table_name: "tbl_product_description",
        column_name: "overview",
        updated_column_value: post.overview,
        p_key: "id",
        item_updated_id: existingDesc ? existingDesc.id : 0
      });
    }

    if (post.product_category !== undefined) {
      const categoryIds = Array.isArray(post.product_category) ? post.product_category.map(String) : [String(post.product_category)];
      const existingCats = existing.arr_cat_selected ? existing.arr_cat_selected.map(c => String(c.category_id)) : [];

      const newCats = categoryIds.sort().join(',');
      const oldCats = existingCats.sort().join(',');

      if (newCats !== oldCats) {
        for (const cat of categoryIds) {
          changes.push({
            table_name: "tbl_product_category",
            column_name: "category_id",
            updated_column_value: cat,
            p_key: "id",
            item_updated_id: 0
          });
        }
      }
    }

    if (changes.length > 0) {
      await updateVendorLogs({
        item_id: product_id,
        profile_id: vendor_id,
        module: "product",
        action_performed: "updated",
        status: 0,
        changes,
        externalTransaction: transaction
      });
    }

    await transaction.commit();
    return { product_id };
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

// Fetch existing product data for editing
export const getProductDetail = async (product_id) => {
  try {
    // 1. Fetch main product data with basic associations
    const product = await Product.findOne({
      where: { product_id, is_deleted: 0 },
      include: [
        { model: ProductDescription, attributes: ['overview', 'description'] },
        { model: ProductSpecification },
        { model: ProductImage, attributes: ['image'], where: { default: 1 }, required: false }
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

    // 3. Handle comma-separated IDs
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

      // Mapped Names
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

    // 2. Define fields to compare
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

export const updateProductSpecification = async (vendor_id, product_id, post) => {
  const brandArr = await getVendorBrands(vendor_id);
  const isVendor = await isVendorProduct(product_id, brandArr);

  if (!isVendor) {
    const error = new Error("Unauthorized: Product does not belong to vendor");
    error.statusCode = 403;
    throw error;
  }

  const toCSV = (val) =>
    Array.isArray(val) ? val.join(",") : val || "";

  const productData = {
    product_id,
    deployment: toCSV(post.deployment),
    device: toCSV(post.device),
    operating_system: toCSV(post.operating_system),
    organization_type: toCSV(post.organization_type),
    languages: toCSV(post.languages),
  };

  const data = await getSelectedCol({
    table: "ProductSpecification",
    columns: ["id"],
    where: { product_id: product_id },
    records: "single",
  });
  const id = data?.id || null;

  return await saveOrUpdateProductSpecification(id, productData, vendor_id);
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

export const updateProductFeature = async (vendor_id, post) => {
  const product_id = post.product_id;
  const section_id = post.section_id;

  let id = post.fid || null;

  if (!id) {
    const data = await getSelectedCol({
      table: "ProductFeature",
      columns: ["id"],
      where: { product_id, section_id },
      records: "single",
    });
    id = data?.id || null;
  }

  return await saveOrUpdateProductFeature(id, post, vendor_id);
};

export const getFeaturesListForVendor = async (vendor_id, product_id, search = null) => {
  const brand = await getVendorBrands(vendor_id);
  const check = await isVendorProduct(product_id, brand);

  if (!check) {
    const error = new Error("Unauthorized: Product does not belong to vendor");
    error.statusCode = 403;
    throw error;
  }

  return await getAllFeatures(search);
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
    return { action: "updated", message: "Changes logged successfully", changes };
  } catch (error) {
    await transaction.rollback();
    console.error("Error in logProductScreenshotsRequest:", error);
    throw error;
  }
};

const cleanFileName = (name) => {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").toLowerCase();
};

export const updateProductScreenshots = async (productId, vendorId, body, files) => {
  // 1. Verify vendor ownership
  const brandArr = await getVendorBrands(vendorId);
  const isVendor = await isVendorProduct(productId, brandArr);
  if (!isVendor) {
    const error = new Error("Unauthorized: Product does not belong to vendor");
    error.status = 403;
    throw error;
  }

  // 2. Parse array-indexed payload
  let { id: ids, 'id[]': idsArr, alt_text: alt_texts, 'alt_text[]': alt_texts_arr, screenshot_hidden: hidden_screenshots, 'screenshot_hidden[]': hidden_screenshots_arr, screenshot_index: screenshot_indices, 'screenshot_index[]': screenshot_indices_arr } = body;
  files = files || [];

  const toArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);
  ids = toArray(ids || idsArr);
  alt_texts = toArray(alt_texts || alt_texts_arr);
  hidden_screenshots = toArray(hidden_screenshots || hidden_screenshots_arr);
  screenshot_indices = toArray(screenshot_indices || screenshot_indices_arr);

  if (alt_texts.length === 0) {
    const error = new Error("alt_text[] is required");
    error.status = 400;
    throw error;
  }

  const screenshotsToProcess = [];

  for (let i = 0; i < alt_texts.length; i++) {
    let currentId = ids[i] || null;
    if (currentId === "0" || currentId === "") currentId = null;
    const currentAlt = alt_texts[i];
    let currentImage = hidden_screenshots[i] || null;

    const filePos = screenshot_indices.findIndex(idx => String(idx) === String(i));

    if (filePos !== -1 && files[filePos]) {
      const file = files[filePos];
      const sanitizedOriginalName = cleanFileName(file.originalname);
      const dbImageName = `${productId}_${sanitizedOriginalName}`;
      const key = `web/assets/images/techjockey/products/screenshots/${dbImageName}`;

      await uploadfile2({ ...file, originalname: dbImageName, key });
      currentImage = dbImageName;
    }

    if (currentImage || currentAlt) {
      screenshotsToProcess.push({
        id: currentId,
        alt_text: currentAlt,
        image: currentImage
      });
    }
  }

  // 3. Log the changes
  const result = await logProductScreenshotsRequest({
    productId,
    vendor_id: vendorId,
    screenshotsData: screenshotsToProcess
  });

  return { result, screenshotsToProcess };
};

export const updateProductGallery = async (productId, vendorId, body, files) => {
  // 1. Verify vendor ownership
  const brandArr = await getVendorBrands(vendorId);
  const isVendor = await isVendorProduct(productId, brandArr);

  if (!isVendor) {
    const error = new Error("Unauthorized: Product does not belong to vendor");
    error.status = 403;
    throw error;
  }

  // 2. Normalize inputs
  const {
    id: ids, 'id[]': idsArr,
    title: titles, 'title[]': titlesArr,
    desc: descriptions, 'desc[]': descriptionsArr,
    gallery_hidden: hidden_galleries, 'gallery_hidden[]': hidden_galleries_arr,
    gallery_index: gallery_indices, 'gallery_index[]': gallery_indices_arr,
    description
  } = body;

  const toArray = (val) => Array.isArray(val) ? val : (val !== undefined && val !== null ? [val] : []);
  const idList = toArray(ids || idsArr);
  const titleList = toArray(titles || titlesArr);
  const descList = toArray(descriptions || descriptionsArr || description || body['description[]']);
  const hiddenList = toArray(hidden_galleries || hidden_galleries_arr);
  const indexList = toArray(gallery_indices || gallery_indices_arr);

  // 3. Min-3 Validation: Check if there are at least 3 non-empty slots
  let validSlotsCount = 0;
  const galleryToProcess = [];
  let fileCounter = 0;

  files = files || [];

  for (let i = 0; i < titleList.length; i++) {
    const currentTitle = titleList[i]?.trim();
    const currentDesc = descList[i]?.trim();
    let currentImage = hiddenList[i] || null;

    const filePos = indexList.length > 0
      ? indexList.findIndex(idx => String(idx) === String(i))
      : fileCounter;

    if (filePos !== -1 && files[filePos]) {
      const file = files[filePos];
      const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9._]+/g, "");
      const dbImageName = `${productId}_${sanitizedOriginalName}`;
      const key = `web/assets/images/techjockey/gallery/${dbImageName}`;

      await uploadfile2({ ...file, originalname: dbImageName, key });
      currentImage = dbImageName;

      if (indexList.length === 0) fileCounter++;
    }

    if (currentTitle && currentDesc && currentImage) {
      validSlotsCount++;
    }

    galleryToProcess.push({
      id: idList[i] || null,
      title: currentTitle,
      description: currentDesc,
      image: currentImage
    });
  }

  if (validSlotsCount < 3) {
    const error = new Error("Please add atleast 3 gallery per product!.");
    error.status = 400;
    throw error;
  }

  // 4. Log changes for approval instead of direct write
  const result = await logProductGalleryRequest({
    productId,
    vendor_id: vendorId,
    galleryData: galleryToProcess
  });

  return { result, galleryToProcess };
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
 * Fetch enrichment images and compute budget math.
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
    let changes = [];

    // 1. Fetch existing enrichment for comparison
    const existingImages = await ProductEnrichmentImage.findAll({
      where: { product_id: productId },
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
      } else if (type || image) {
        // INSERT case: Create insert-style logs (item_updated_id: 0)
        // Always log type for new enrichment items
        changes.push({
          table_name: "tbl_product_enrichment_images",
          column_name: "type",
          updated_column_value: type,
          p_key: "id",
          item_updated_id: 0,
          linked_attribute: groupLinkedAttr
        });
        // Log image if present
        if (image) {
          changes.push({
            table_name: "tbl_product_enrichment_images",
            column_name: "enrichment_image",
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
    console.error("Error in logProductEnrichmentRequest:", error);
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
 * Handle video approval workflow via vendor_logs.
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

export const updateProductVideo = async (productId, vendorId, body) => {
  const {
    video_id, 'video_id[]': videoIdArr,
    video_url, 'video_url[]': videoUrlArr,
    video_title, 'video_title[]': videoTitleArr
  } = body;

  const toArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);
  const idList = toArray(video_id || videoIdArr);
  const urlList = toArray(video_url || videoUrlArr);
  const titleList = toArray(video_title || videoTitleArr);

  if (urlList.length === 0) {
    const error = new Error("At least one video URL is required");
    error.status = 400;
    throw error;
  }

  const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
  for (const url of urlList) {
    if (url && !urlPattern.test(url)) {
      const error = new Error(`Invalid URL: ${url}`);
      error.status = 400;
      throw error;
    }
  }

  const videoData = urlList.map((url, i) => ({
    id: idList[i] || null,
    video_url: url || "",
    video_title: titleList[i] || ""
  }));

  const existingVideos = await getProductVideos(productId);
  const existingCount = Array.isArray(existingVideos) ? existingVideos.length : 0;
  const newItemsCount = videoData.filter(v => !v.id || String(v.id) === "0").length;

  if (existingCount + newItemsCount > 10) {
    const error = new Error(`Maximum 10 videos are allowed per product. Current: ${existingCount}, Attempting to add: ${newItemsCount}`);
    error.status = 400;
    throw error;
  }

  const result = await logProductVideoRequest({
    productId,
    vendor_id: vendorId,
    videoData
  });

  return { result, videoData };
};

/**
 * Wrapper: fetch products for a vendor using vendor_id and query options.
 * Keeps controller thin by centralizing getVendorBrands + getProductList logic.
 */
export const getVendorProductList = async (vendor_id, options = {}) => {
  // Fetch vendor brand array
  const brand_arr = await getVendorBrands(vendor_id);

  // Delegate to existing getProductList which handles pagination/sorting
  const products = await getProductList(
    brand_arr,
    { srch_product_name: options.srch_product_name || "", srch_status: options.srch_status || "" },
    options.order_by || "s_id",
    options.order || "desc",
    options.limit,
    options.pageNumber,
    vendor_id
  );

  return products;
};

export const updateProductEnrichment = async (productId, vendorId, body, files) => {
  const {
    id: ids, 'id[]': idsArr,
    type: types, 'type[]': typesArr,
    enrichment_hidden: hidden_enrichments, 'enrichment_hidden[]': hidden_enrichments_arr,
    enrichment_index: enrichment_indices, 'enrichment_index[]': enrichment_indices_arr
  } = body;

  const toArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);
  const idList = toArray(ids || idsArr);
  const typeList = toArray(types || typesArr);
  const hiddenList = toArray(hidden_enrichments || hidden_enrichments_arr);
  const indexList = toArray(enrichment_indices || enrichment_indices_arr);

  if (typeList.length === 0) {
    const error = new Error("type[] is required");
    error.status = 400;
    throw error;
  }

  const typeCounts = typeList.reduce((acc, t) => {
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  files = files || [];

  if ((typeCounts[1] || 0) < 4 || (typeCounts[2] || 0) < 4) {
    const error = new Error("Please add 4 enrichment images for desktop and mobile view");
    error.status = 400;
    throw error;
  }

  let validSlots = 0;
  for (let i = 0; i < typeList.length; i++) {
    const hasFile = indexList.some(idx => String(idx) === String(i));
    const existingImg = hiddenList[i];
    const hasExistingImage = existingImg && existingImg !== "null" && existingImg !== "undefined" && existingImg !== "";

    if (hasFile || hasExistingImage) {
      validSlots++;
    }
  }

  if (validSlots < 8) {
    const error = new Error("Please add 4 enrichment images for desktop and mobile view");
    error.status = 400;
    throw error;
  }

  const enrichmentInfo = await getProductEnrichmentImages(productId);
  const heightMapping = enrichmentInfo.image_height_mapping;

  let currentDesktopHeight = 2400 - enrichmentInfo.desktop_remaining_height;
  let currentMobileHeight = 4000 - enrichmentInfo.mobile_remaining_height;

  const enrichmentToProcess = [];
  const cleanFileName = (name) => name.replace(/[^a-zA-Z0-9._-]+/g, "");

  for (let i = 0; i < typeList.length; i++) {
    const type = Number(typeList[i]);
    let currentId = idList[i] || null;
    if (currentId === "undefined" || currentId === "null" || currentId === "0" || currentId === "") {
      currentId = null;
    }

    let currentImage = null;
    let newImageWidth = 0;
    let newImageHeight = 0;

    let fileToUpload = null;
    let fileOriginalName = null;

    const filePos = indexList.findIndex(idx => String(idx) === String(i));
    if (filePos !== -1 && files && files[filePos]) {
      fileToUpload = files[filePos];
      fileOriginalName = fileToUpload.originalname || `enrichment_${i}`;
    }

    if (!fileToUpload && hiddenList[i]) {
      const hiddenItem = hiddenList[i];
      if (Buffer.isBuffer(hiddenItem) || (hiddenItem && typeof hiddenItem === 'object' && (hiddenItem.buffer || hiddenItem.data))) {
        fileToUpload = hiddenItem;
        fileOriginalName = hiddenItem.originalname || hiddenItem.filename || `enrichment_${i}`;
      } else if (typeof hiddenItem === 'string' && hiddenItem !== "null" && hiddenItem !== "undefined" && hiddenItem !== "") {
        currentImage = hiddenItem;
      }
    }

    if (fileToUpload) {
      try {
        let buffer = fileToUpload;
        if (fileToUpload.buffer) {
          buffer = fileToUpload.buffer;
        } else if (fileToUpload.data) {
          buffer = fileToUpload.data;
        }

        const dimensions = sizeOf(buffer);
        newImageWidth = dimensions.width;
        newImageHeight = dimensions.height;

        if (type === 1) {
          const oldHeight = currentId ? (heightMapping[currentId] || 0) : 0;
          const newTotalHeight = currentDesktopHeight - oldHeight + newImageHeight;
          if (newTotalHeight > 2400) {
            const error = new Error(`Desktop height budget exceeded at slot ${i + 1}. Current: ${newTotalHeight}px, Max: 2400px`);
            error.status = 400;
            throw error;
          }
          if (newImageWidth > 1260) {
            const error = new Error(`Desktop image width (Found: ${newImageWidth}px) exceeds 1260px at slot ${i + 1}`);
            error.status = 400;
            throw error;
          }
          currentDesktopHeight = newTotalHeight;
        } else {
          const oldHeight = currentId ? (heightMapping[currentId] || 0) : 0;
          const newTotalHeight = currentMobileHeight - oldHeight + newImageHeight;
          if (newTotalHeight > 4000) {
            const error = new Error(`Mobile height budget exceeded at slot ${i + 1}. Current: ${newTotalHeight}px, Max: 4000px`);
            error.status = 400;
            throw error;
          }
          if (newImageWidth > 600) {
            const error = new Error(`Mobile image width (Found: ${newImageWidth}px) exceeds 600px at slot ${i + 1}`);
            error.status = 400;
            throw error;
          }
          currentMobileHeight = newTotalHeight;
        }

        const sanitizedName = cleanFileName(fileOriginalName);
        const dbImageName = `${productId}_${sanitizedName}`;
        const key = `web/assets/images/techjockey/gallery/${dbImageName}`;

        await uploadfile2({
          ...fileToUpload,
          originalname: dbImageName,
          key,
          buffer: buffer
        });

        currentImage = dbImageName;
      } catch (uploadError) {
        console.error(`[Slot ${i}] File upload failed:`, uploadError);
        throw uploadError;
      }
    }

    if (currentImage) {
      enrichmentToProcess.push({
        id: currentId,
        type,
        image: currentImage,
        image_width: newImageWidth,
        image_height: newImageHeight,
        product_id: productId
      });
    }
  }

  const result = await logProductEnrichmentRequest({
    productId,
    vendor_id: vendorId,
    enrichmentData: enrichmentToProcess
  });

  return { result, enrichmentToProcess };
};

