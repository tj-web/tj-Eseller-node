import sequelize from "../../db/connection.js";
import { QueryTypes, Op } from "sequelize";
import Product from "../product.js";
import ProductImage from "../productImage.js";
import ProductSpecification from "../productSpecification.model.js";
import ProductDescription from "../productDescription.model.js";
import ProductCategory from "../productCategory.js";
import Category from "../category.js";
import OperatingSystem from "../operatingSystem.model.js";
import ProductIndustry from "../productIndustry.model.js";
import BusinessType from "../businessType.model.js";
import ProductFaq from "../productFaqs.model.js";
import ProductScreenshot from "../productScreenshot.js";
import ProductVideo from "../productVideo.js";



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

// export const getProductDetail = async (product_id) => {
//   try {
//     const product = await Product.findOne({
//       attributes: [
//         'product_name', 'status', 'brand_id', 'website_url',
//         // Comma-separated ID mapping logic moved to literals for performance/simplicity
//         [sequelize.literal(`(SELECT GROUP_CONCAT(os.os_name) FROM tbl_operating_systems os WHERE FIND_IN_SET(os.id, IFNULL(ProductSpecification.operating_system, '')))`), 'operating_system_names'],
//         [sequelize.literal(`(SELECT GROUP_CONCAT(os.os_image) FROM tbl_operating_systems os WHERE FIND_IN_SET(os.id, IFNULL(ProductSpecification.operating_system, '')))`), 'operating_system_images'],
//         [sequelize.literal(`(SELECT GROUP_CONCAT(pi.name) FROM tbl_product_industry pi WHERE FIND_IN_SET(pi.id, IFNULL(ProductSpecification.industries, '')))`), 'industries_names'],
//         [sequelize.literal(`(SELECT GROUP_CONCAT(bt.business_type_name) FROM tbl_business_type bt WHERE FIND_IN_SET(bt.id, IFNULL(ProductSpecification.business, '')))`), 'business_names']
//       ],
//       where: { product_id },
//       include: [
//         { model: ProductDescription, attributes: ['overview', 'description'] },
//         { model: ProductSpecification, attributes: ['industries', 'business', 'deployment', 'device', 'operating_system', 'hw_configuration', 'sw_configuration'] },
//         { model: ProductImage, attributes: ['image'], limit: 1 }
//       ],
//       nest: true,
//       raw: true
//     });

//     if (!product) return null;

//     // Fetch related lists separately to avoid heavy joins
//     const faqs = await ProductFaq.findAll({
//       attributes: ['question', 'answer'],
//       where: { product_id },
//       raw: true
//     });

//     const screenshots = await ProductScreenshot.findAll({
//       attributes: ['id', 'image'],
//       where: { product_id },
//       raw: true
//     });

//     const videos = await ProductVideo.findAll({
//       attributes: ['id', 'video_url'],
//       where: { product_id },
//       raw: true
//     });

//     // Format data to match original output
//     return {
//       product_name: product.product_name,
//       overview: product.ProductDescription?.overview,
//       description: product.ProductDescription?.description,
//       image: product.ProductImage?.image,
//       status: product.status,
//       industries: product.ProductSpecification?.industries,
//       business: product.ProductSpecification?.business,
//       deployment: product.ProductSpecification?.deployment,
//       device: product.ProductSpecification?.device,
//       operating_system: product.ProductSpecification?.operating_system,
//       hw_configuration: product.ProductSpecification?.hw_configuration,
//       sw_configuration: product.ProductSpecification?.sw_configuration,
//       brand_id: product.brand_id,
//       website_url: product.website_url,
//       operating_system_names: product.operating_system_names,
//       operating_system_images: product.operating_system_images,
//       industries_names: product.industries_names,
//       business_names: product.business_names,
//       faqs,
//       screenshot: screenshots,
//       videos
//     };

//   } catch (error) {
//     console.error("Error in getProductDetail service:", error);
//     throw error;
//   }
// };


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


export const getSelectedCol = async ({
  table,
  columns = [],
  where = {},
  records = "single",
  order_by = null
}) => {
  try {
    
    const Model = sequelize.models[table];

    if (!Model) {
      throw new Error(`Model for table '${table}' not found. Make sure it's imported in your connection file.`);
    }

    let order = [];
    if (order_by && Object.keys(order_by).length > 0) {
      order = Object.entries(order_by).map(([key, value]) => [key, value]);
    }

    const options = {
      attributes: columns.length > 0 ? columns : undefined, // undefined returns all cols
      where: where,
      order: order,
      raw: true, 
    };

    if (records === "single") {
      return await Model.findOne(options);
    } else {
      return await Model.findAll(options);
    }

  } catch (error) {
    console.error(`Error in getSelectedCol for table ${table}:`, error);
    throw error;
  }
};





