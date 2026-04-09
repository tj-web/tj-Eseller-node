import Brand from "../models/brand.js";
import VendorBrandRelation from "../models/vendorBrandRelation.js";
import BrandInfo from "../models/brandInfo.js";
import BrandLocation from "../models/brandLocation.js";
import BrandCity from "../models/brandCity.js";
import VendorLog from "../models/vendorLog.js";
import sequelize from "../db/connection.js";
import { AppError } from "../utilis/appError.js";

/* =========================================
   CHECK BRAND NAME AVAILABILITY
========================================= */
export const checkBrandNameService = async (
  brand_name,
  exclude_brand_id = null,
) => {
  const whereClause = {
    brand_name: brand_name,
    is_deleted: 0,
  };

  if (exclude_brand_id) {
    whereClause.brand_id = { [sequelize.Sequelize.Op.ne]: exclude_brand_id };
  }

  const brand = await Brand.findOne({ where: whereClause });
  // Returns true if brand exists securely via ORM
  return !!brand;
};

/* =========================================
   ADD BRAND CORE LOGIC
========================================= */
export const addBrandService = async (data, vendorId, profileId) => {
  const {
    brand_name,
    image,
    location,
    founded_on,
    founders,
    company_size,
    information,
    industry,
  } = data;

  const transaction = await sequelize.transaction();

  try {
    // 1. Validate Brand Name Collision using ORM
    const isExists = await checkBrandNameService(brand_name);
    if (isExists) {
      throw new AppError("Brand name already exists", 300);
    }

    // Define the full spectrum of required fallback constraints since the strict brand.js ORM schema mandates allowNull: false without explicit defaults
    const defaultBrandCols = {
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
      brand_onboarded: 0,
      part_agree_date: new Date(),
      vendor_sheet_rec: 0,
      oem_onboarded_by: "",
      tj_agree_by_oem: 0,
      oem_agree_by_tj: 0,
      agreement_attach: "",
      lead_locking: 0,
      lead_url: "",
      lead_username: "",
      lead_password: "",
      commission_type: 1,
      commission: 0,
      commission_comment: "",
      renewal_terms: 0.0,
      renewal_terms_comment: "",
      payment_terms: "",
      payment_terms_comment: "",
      remarks: "",
      vendor_sheet: "",
      onboard_last_updated: new Date(),
      oem_onboarded_date: new Date(),
      declined_by: 0,
    };

    // 2. Map and Create Core Brand via ORM
    const newBrand = await Brand.create(
      {
        ...defaultBrandCols,
        brand_name,
        image: image || "",
        date_added: new Date(),
        status: 0,
        added_by: "vendor",
        added_by_id: vendorId,
        show_status: 0,
      },
      { transaction },
    );

    const brandId = newBrand.brand_id || newBrand.id; // Support both primary key conventions

    // 3. Create Supplemental Brand Info mapping via ORM
    await BrandInfo.create(
      {
        tbl_brand_id: brandId,
        location: location || "",
        founded_on,
        founders,
        company_size,
        information,
        industry: industry || "",
        created_at: new Date(),
      },
      { transaction },
    );

    // 4. Bind the Security Relationship natively via ORM
    await VendorBrandRelation.create(
      {
        vendor_id: vendorId,
        tbl_brand_id: brandId,
        status: 0,
        is_requested: 0,
        created_at: new Date(),
      },
      { transaction },
    );

    // 5. Build an Administrative VendorLog via ORM
    const logData = [
      {
        tableName: "tbl_brand",
        col: "brand_name",
        pKey: "brand_id",
        val: brand_name,
      },
      {
        tableName: "tbl_brand_info",
        col: "location",
        pKey: "id",
        val: location,
      },
      {
        tableName: "tbl_brand_info",
        col: "founded_on",
        pKey: "id",
        val: founded_on,
      },
      {
        tableName: "tbl_brand_info",
        col: "founders",
        pKey: "id",
        val: founders,
      },
      {
        tableName: "tbl_brand_info",
        col: "company_size",
        pKey: "id",
        val: company_size,
      },
      {
        tableName: "tbl_brand_info",
        col: "information",
        pKey: "id",
        val: information,
      },
      {
        tableName: "tbl_brand_info",
        col: "industry",
        pKey: "id",
        val: industry,
      },
    ];

    // Bulk insert auditing loops via Sequelize standard mapping
    for (const log of logData) {
      if (log.val) {
        await VendorLog.create(
          {
            item_id: brandId,
            module: "brand",
            action_performed: "insert",
            action_by: profileId,
            table_name: log.tableName,
            column_name: log.col,
            p_key: log.pKey,
            updated_column_value: log.val.toString(),
            linked_attribute: "",
            item_updated_id: 0,
            reject_reason: "",
            status: 0,
            created_at: new Date(),
            updated_at: new Date(),
          },
          { transaction },
        );
      }
    }

    // 6. Complete Transaction Context
    await transaction.commit();

    return {
      message: "Brand Saved Successfully.",
      brand_id: brandId,
    };
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

/* =========================================
   GET VENDOR BRANDS LIST
========================================= */
export const getVendorBrandsService = async (params) => {
  const {
    vendor_id,
    orderby,
    order,
    srch_brand_name,
    srch_status,
    limit = 10,
    pagenumber = 1,
  } = params;

  // Dynamically set up ORM Associations for this loop securely
  VendorBrandRelation.belongsTo(Brand, {
    foreignKey: "tbl_brand_id",
    targetKey: "brand_id",
  });

  const offset = (pagenumber - 1) * limit;

  const whereCondition = {
    vendor_id: vendor_id,
    tbl_brand_id: { [sequelize.Sequelize.Op.ne]: 0 },
  };

  if (srch_status !== undefined && srch_status !== "") {
    whereCondition.status = srch_status;
  }

  const brandWhere = {};
  if (srch_brand_name) {
    brandWhere.brand_name = {
      [sequelize.Sequelize.Op.like]: `%${srch_brand_name}%`,
    };
  }

  // Construct ordering natively for ORM
  let orderLogic = [["id", order || "desc"]]; // Default mapped
  if (orderby === "s_id") orderLogic = [[Brand, "brand_id", order]];
  else if (orderby === "s_brand_name")
    orderLogic = [[Brand, "brand_name", order]];
  else if (orderby === "s_status") orderLogic = [["status", order]];

  const rows = await VendorBrandRelation.findAll({
    where: whereCondition,
    include: [
      {
        model: Brand,
        required: !!srch_brand_name, // Validates INNER if filtering, LEFT if just listing
        where: Object.keys(brandWhere).length ? brandWhere : undefined,
        attributes: ["brand_name", "description", "image", "status"],
      },
    ],
    order: orderLogic,
    offset: parseInt(offset),
    limit: parseInt(limit),
  });

  return rows;
};

/* =========================================
   GET VENDOR BRANDS COUNT
========================================= */
export const getVendorBrandsCountService = async (
  vendor_id,
  srch_brand_name = "",
) => {
  VendorBrandRelation.belongsTo(Brand, {
    foreignKey: "tbl_brand_id",
    targetKey: "brand_id",
  });

  const whereCondition = {
    vendor_id: vendor_id,
    tbl_brand_id: { [sequelize.Sequelize.Op.ne]: 0 },
  };

  const brandWhere = {};
  if (srch_brand_name) {
    brandWhere.brand_name = {
      [sequelize.Sequelize.Op.like]: `%${srch_brand_name}%`,
    };
  }

  const rows = await VendorBrandRelation.findAll({
    attributes: [
      "status",
      [sequelize.fn("COUNT", sequelize.col("VendorBrandRelation.id")), "count"],
    ],
    where: whereCondition,
    include: [
      {
        model: Brand,
        required: !!srch_brand_name,
        where: Object.keys(brandWhere).length ? brandWhere : undefined,
        attributes: [],
      },
    ],
    group: ["VendorBrandRelation.status"],
  });

  const counts = { all: 0, pending: 0, approved: 0, declined: 0 };
  for (const row of rows) {
    const rawData = row.get({ plain: true });
    const n = Number(rawData.count) || 0;
    counts.all += n;
    if (rawData.status === 0) counts.pending += n;
    else if (rawData.status === 1) counts.approved += n;
    else if (rawData.status === 2) counts.declined += n;
  }
  return counts;
};

/* =========================================
   GET FULL BRAND DETAILS BY ID (FOR EDIT)
========================================= */
export const getBrandByIdService = async (vendor_id, brand_id) => {
  Brand.hasMany(VendorBrandRelation, {
    foreignKey: "tbl_brand_id",
    sourceKey: "brand_id",
  });
  Brand.hasOne(BrandInfo, {
    foreignKey: "tbl_brand_id",
    sourceKey: "brand_id",
  });

  const brand = await Brand.findOne({
    attributes: ["brand_name", "description", "image", "status"],
    where: { brand_id: brand_id },
    include: [
      {
        model: VendorBrandRelation,
        required: true, // Strict requirement ensuring permissions organically
        where: { vendor_id: vendor_id },
        attributes: [],
      },
      {
        model: BrandInfo,
        required: false, // Standard loose injection
        attributes: [
          "id",
          "information",
          "founded_on",
          "founders",
          "company_size",
          "location",
          "industry",
        ],
      },
    ],
  });

  if (!brand) return null;

  // Emulates the old raw SQL flat structure output precisely
  const plainBrand = brand.get({ plain: true });
  const info = plainBrand.BrandInfo || {};

  return {
    brand_name: plainBrand.brand_name,
    description: plainBrand.description,
    image: plainBrand.image,
    status: plainBrand.status,
    tbl_info_id: info.id || null,
    information: info.information,
    founded_on: info.founded_on,
    founders: info.founders,
    company_size: info.company_size,
    location: info.location,
    industry: info.industry,
  };
};

/* =========================================
   VIEW BRAND CORE LOGIC
========================================= */
export const viewBrandService = async (brand_id, vendor_id) => {
  const data = await getBrandByIdService(vendor_id, brand_id);

  if (!data) return false;

  data.active_tab = "view_brand";

  const locationIds = await BrandLocation.findAll({
    where: { brand_id: brand_id },
    attributes: ["location_id"],
  });

  data.brand_location = locationIds.map((loc) => ({
    location_id: loc.location_id,
  }));
  data.location_ids = locationIds.map((loc) => loc.location_id);

  return data;
};

/* =========================================
   GET HUMAN-READABLE BRAND LOCATION
========================================= */
export const getBrandLocationService = async (brand_id) => {
  BrandLocation.belongsTo(BrandCity, {
    foreignKey: "location_id",
    targetKey: "city_id",
  });

  const locations = await BrandLocation.findAll({
    where: { brand_id: brand_id },
    include: [
      {
        model: BrandCity,
        attributes: ["city_name"],
        required: false,
      },
    ],
    attributes: ["id", "location_id"],
  });

  return locations.map((loc) => ({
    id: loc.id,
    location_id: loc.location_id,
    city_name: loc.BrandCity ? loc.BrandCity.city_name : null,
  }));
};

/* =========================================
   UPDATE BRAND LOGIC
========================================= */
export const updateBrandService = async (brand_id, updateData, transaction) => {
  await Brand.update(
    {
      brand_name: updateData.brand_name,
      ...(updateData.image !== null && { image: updateData.image }),
    },
    { where: { brand_id: brand_id }, transaction },
  );

  await BrandInfo.update(
    {
      location: updateData.location,
      information: updateData.information,
      founded_on: updateData.founded_on,
      founders: updateData.founders,
      company_size: updateData.company_size,
      industry: updateData.industry,
    },
    { where: { tbl_brand_id: brand_id }, transaction },
  );

  return true;
};

/* =========================================
   REQUEST BRAND LOGIC
========================================= */

export const requestBrandService = async (brandIdsArray, vendorId) => {
  try {
    const mappedInsertions = brandIdsArray.map((brandId) => ({
      vendor_id: vendorId,
      tbl_brand_id: brandId,
      status: 0,
      is_requested: 1,
      created_at: new Date(),
    }));

    await VendorBrandRelation.bulkCreate(mappedInsertions);

    return true;
  } catch (error) {
    throw error;
  }
};
