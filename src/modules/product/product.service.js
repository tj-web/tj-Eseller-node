import sequelize from "../../db/connection.js";
import { Op, QueryTypes } from "sequelize";
import VendorBrandRelation from "../../models/vendorBrandRelation.model.js";
import Brand from "../../models/brand.model.js";
import Product from "../../models/product.model.js";
import ProductImage from "../../models/productImage.model.js";
import Category from "../../models/category.model.js";
import ProductSpecification from "../../models/productSpecification.model.js";
import Setting from "../../models/websiteSetting.model.js"
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
    whereConditions.status = search_filter.srch_status;
  }

  const results = await Product.findAndCountAll({
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
        where: { default: 1 },
        required: false // LEFT JOIN
      }
    ],
    order: [[sortColumn, order]],
    limit: limitNum,
    offset: offset,
    raw: true,
    nest: true,
    logging:true
    // Emulate GROUP BY tp.product_id by taking unique products if needed
    // In practice, if there are multiple images, raw: true + nest: true might return multiple rows.
    // However, the original SQL had GROUP BY tp.product_id, usually to get a single image if any.
    // For many-to-many or many-to-one transformations like this, we usually flat them out.
  });

  // Flatten the result to match raw SQL output
  const flattenedResults = results.rows.map(row => ({
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

  // Return both count and data for pagination
  return {
    count: results.count,
    rows: flattenedResults
  };
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


export const saveProduct = async (save, imageUrl = null, productId = null) => {
  let newProductId;

  if (productId) {
    // --- Update existing product ---
    await Product.update(save, {
      where: { product_id: productId },
    });
    newProductId = productId;
  } else {
    // --- Insert new product ---
    const product = await Product.create(save);
    newProductId = product.product_id;
  }

  // --- Handle Image Insertion ---
  if (imageUrl) {
    const fileName = imageUrl.split("/").pop(); 
    const imageName = fileName.replace(/\.[^/.]+$/, ""); 

    await ProductImage.create({
      product_id: newProductId,
      image: fileName,
      image_name: imageName,
      // 'default', 'status', and 'dominant_color' will use the 
      // defaultValue defined in your schema automatically.
    });
  }

  return newProductId;
};

export const updateProductPricingDocument = async (productId, pricingDocument) => {
  await Product.update(
    { pricing_document: pricingDocument },
    { where: { product_id: productId } }
  );
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
}) => {
  await ProductCategory.destroy({ where: { product_id: productId } });

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
    });
  }
};

//--------------This function will fetch the data of the existing product for editing purpose----------------

export const getProductDetail = async (product_id) => {
  try {
    // 1. Fetch main product data with basic associations
    const product = await Product.findOne({
      where: { product_id },
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
      where: { product_id: productId },
      include: [
        { model: ProductDescription, attributes: ['id', 'overview'] },
        { model: ProductImage, attributes: ['image_id', 'image'] }
      ],
      nest: true,
      raw: true
    });

    if (!product) return null;

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
      image: product.ProductImages?.[0]?.image || product.ProductImage?.image || null,
      overview: product.ProductDescription?.overview || null,
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

export const saveOrUpdateProductSpecification = async (id, productData) => {
  try {
    // Merge defaults with incoming data
    const dataPayload = { ...productData, ...defaultCols };

    if (id) {
      //  UPDATE
      await ProductSpecification.update(dataPayload, {
        where: { id: id }
      });

      return { id, ...dataPayload, updated: true };
    } else {
      //  INSERT
      const newSpec = await ProductSpecification.create(dataPayload);

      return { 
        id: newSpec.id, 
        ...dataPayload, 
        created: true 
      };
    }
  } catch (error) {
    console.error("Error in saveOrUpdateProductSpecification:", error);
    throw error;
  }
};




export const getProductFeatures = async (product_id) => {
  try {
    const productFeatures = await ProductFeature.findAll({
      where: {
        product_id: product_id,
        is_deleted: 0 // Adding a safety check to only get active features
      },
      order: [['sort_order', 'ASC']] // Optional: ensures they appear in the right order
    });

    return productFeatures;
  } catch (error) {
    console.error("Error in getAllFeatures service:", error);
    throw error;
  }
};

export const getAllFeatures = async () => {
  try {
    const features = await Feature.findAll({
      attributes: ['feature_id', 'feature_name'],
      where: {
        status: 1,
        is_deleted: 0
      },
      order: [['feature_name', 'ASC']]
    });

    return features;
  } catch (error) {
    console.error("Error fetching feature list:", error);
    throw error;
  }
};

export const saveOrUpdateProductFeature = async (id, post) => {
  try {
    if (id) {
      await ProductFeature.update(
        {
          section_id: post.section_id,
          description: post.description || "",
          feature_display_name: post.feature_display_name || "",
          product_id: post.product_id,
          type: post.type || 0,
          image: post.image || "",
        },
        { where: { id } }
      );
      return { action: "update", id };
    }

    const newFeature = await ProductFeature.create({
      section_id: post.section_id,
      description: post.description || "",
      feature_display_name: post.feature_display_name || "",
      product_id: post.product_id,
      type: post.type || 0,
      image: post.image || "",
      created_at: post.created_at || new Date(),
    });

    return { action: "insert", id: newFeature.id };
  } catch (error) {
    console.error("Error in saveOrUpdateProductFeature (service):", error);
    throw error;
  }
};


export const insertProductScreenshots = async (screenshotsData) => {
  try {
    if (!screenshotsData || screenshotsData.length === 0) return { inserted: 0, updated: 0 };

    
    const formattedData = screenshotsData.map(item => ({
      id: item.id || null, 
      product_id: item.product_id,
      image: item.image,
      img_alt: item.alt_text || item.img_alt || null, 
      sort_order: item.sort_order || 0,
      status: item.status ?? 1,
      is_deleted: item.is_deleted ?? 0,
      section_id: item.section_id || null
    }));

    // 2. Perform the bulk operation
    // This will check the PRIMARY KEY (id). 
    // If ID exists, it UPDATES. If ID is null/doesn't exist, it INSERTS.
    const result = await ProductScreenshot.bulkCreate(formattedData, {
      updateOnDuplicate: ["product_id", "image", "img_alt", "sort_order", "status", "is_deleted", "section_id"]
    });

    return { totalProcessed: result.length };
  } catch (error) {
    console.error("Error in insertProductScreenshots:", error);
    throw error;
  }
};

export const addGalleryModel = async (filesData, product_id) => {
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
        is_deleted: item.is_deleted ?? 0
      };

      if (item.id) {
        // --- Update existing record ---
        await DescriptionGallery.update(dataPayload, {
          where: { id: item.id }
        });

        galleryData.push({ ...dataPayload, id: item.id });
      } else {
        // --- Insert new record ---
        const newRecord = await DescriptionGallery.create(dataPayload);

        galleryData.push(newRecord.get({ plain: true }));
      }
    }

    return galleryData;
  } catch (error) {
    console.error("Error in addGalleryModel:", error);
    throw error;
  }
};


export const upsertEnrichmentImages = async (enrichmentData) => {
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
        });

        saved.push(newRecord.get({ plain: true }));
      }
    }

    return saved;
  } catch (error) {
    console.error("Error in upsertEnrichmentImages:", error);
    throw error;
  }
};


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
      ]
    });

    // Return the original formatted data with IDs from the result
    // This ensures correct timestamps in the response
    return formattedVideos.map((item, index) => ({
      ...item,
      id: result[index]?.id || item.id, // Get the ID from the result if it was inserted
      created_at: item.created_at, 
      updated_at: item.updated_at  
    }));

  } catch (error) {
    console.error("Error in addVideoModel:", error);
    throw error;
  }
};