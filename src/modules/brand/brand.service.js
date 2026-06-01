import Brand from "../../models/brand.model.js";
import VendorBrandRelation from "../../models/vendorBrandRelation.model.js";
import BrandInfo from "../../models/brandInfo.model.js";
import BrandLocation from "../../models/brandLocation.model.js";
import BrandCity from "../../models/brandCity.model.js";
import VendorLog from "../../models/vendorLog.model.js";
import Product from "../../models/product.model.js";
import TblLeads from "../../models/leads.model.js";
import sequelize from "../../db/connection.js";
import { AppError } from "../../utilis/appError.js";
import { Op } from "sequelize";
import { findDifferences } from "../../General_Function/general_helper.js";
import { uploadfile2 } from "../../utilis/s3Uploader.js";

VendorBrandRelation.belongsTo(Brand, {
  foreignKey: "tbl_brand_id",
  targetKey: "brand_id",
});
VendorBrandRelation.hasOne(BrandInfo, {
  foreignKey: "tbl_brand_id",
  sourceKey: "tbl_brand_id",
});
Brand.hasMany(VendorBrandRelation, {
  foreignKey: "tbl_brand_id",
  sourceKey: "brand_id",
});
Brand.hasOne(BrandInfo, {
  foreignKey: "tbl_brand_id",
  sourceKey: "brand_id",
});
BrandLocation.belongsTo(BrandCity, {
  foreignKey: "location_id",
  targetKey: "city_id",
});

/* =========================================
   CHECK BRAND NAME AVAILABILITY
========================================= */
export const checkBrandName = async (brand_name, exclude_brand_id = null) => {
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
export const handleAddBrand = async (data, file, vendorId, profileId) => {
  const { brand_name, image, location, founded_on, founders, company_size, information, industry } =
    data;

  const transaction = await sequelize.transaction();

  try {
    // 1. Validate Brand Name Collision using ORM
    const isExists = await checkBrandName(brand_name);
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
        status: 1,
        added_by: "vendor",
        added_by_id: vendorId,
        show_status: 0,
      },
      { transaction }
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
      { transaction }
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
      { transaction }
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
            status: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
          { transaction }
        );
      }
    }

    if (file) {
      // Sanitize and build S3 filename that includes brand_id
      const originalName = file.originalname.replace(/[^a-zA-Z0-9._]+/g, "");
      const fileName = `${brandId}_${originalName}`;

      // Prepare upload object: ensure we pass the file buffer and proper originalname + key
      const fileobj = {
        ...file,
        originalname: fileName,
        key: `web/assets/images/techjockey/brands/${fileName}`,
      };
      await uploadfile2(fileobj);

      // Persist image name in tbl_brand
      await Brand.update({ image: fileName }, { where: { brand_id: brandId }, transaction });

      // Insert vendor log entry for the image
      await VendorLog.create({
        item_id: brandId,
        module: "brand",
        action_performed: "insert",
        action_by: profileId,
        table_name: "tbl_brand",
        column_name: "image",
        p_key: "brand_id",
        updated_column_value: fileName,
        linked_attribute: "",
        item_updated_id: 0,
        reject_reason: "",
        status: 1,
        created_at: new Date(),
        updated_at: new Date(),
      }, { transaction });
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
export const getVendorBrands = async (params) => {
  const {
    vendor_id,
    orderby,
    order,
    srch_brand_name,
    srch_status,
    brand_status,
    limit = 10,
    pagenumber = 1,
  } = params;

  const limitNum = parseInt(limit) || 10;
  const pageNum = parseInt(pagenumber) || 1;
  const offsetNum = (pageNum - 1) * limitNum;

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
  if (brand_status !== undefined && brand_status !== "") {
    // Apply brand_status filter on the Brand include (tbl_brand.status)
    brandWhere.status = parseInt(brand_status, 10);
  }

  let orderLogic = [["id", order && order.toUpperCase() === "ASC" ? "ASC" : "DESC"]]; // Default mapped
  if (orderby === "s_id") orderLogic = [[Brand, "brand_id", order || "DESC"]];
  else if (orderby === "s_brand_name") orderLogic = [[Brand, "brand_name", order || "ASC"]];
  else if (orderby === "s_status") orderLogic = [["status", order || "DESC"]];

  const rows = await VendorBrandRelation.findAll({
    where: whereCondition,
    include: [
      {
        model: Brand,
        required: !!(srch_brand_name || brand_status), // INNER JOIN when searching by name or filtering by brand_status
        where: Object.keys(brandWhere).length ? brandWhere : undefined,
        attributes: ["brand_name", "description", "image", "status", "target_industry"],
      },
      {
        model: BrandInfo,
        required: false,
        attributes: ["industry"],
      },
    ],
    order: orderLogic,
    offset: offsetNum,
    limit: limitNum,
  });

  // Project standard pattern: Fetch stats for current page items separately
  const brandIds = rows.map((row) => row.tbl_brand_id).filter(Boolean);

  if (brandIds.length > 0) {
    const [productCounts, leadCounts] = await Promise.all([
      Product.findAll({
        attributes: ["brand_id", [sequelize.fn("COUNT", sequelize.col("product_id")), "count"]],
        where: {
          brand_id: { [Op.in]: brandIds },
          is_deleted: 0,
        },
        group: ["brand_id"],
        raw: true,
      }),
      TblLeads.findAll({
        attributes: ["brand_id", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
        where: {
          brand_id: { [Op.in]: brandIds },
          product_id: { [Op.ne]: 0 },
        },
        group: ["brand_id"],
        raw: true,
      }),
    ]);

    rows.forEach((row) => {
      const p = productCounts.find((c) => c.brand_id === row.tbl_brand_id);
      const l = leadCounts.find((c) => c.brand_id === row.tbl_brand_id);

      row.setDataValue("total_product", p ? p.count : 0);
      row.setDataValue("total_leads", l ? l.count : 0);
    });
  }

  return rows;
};

/* =========================================
   GET VENDOR BRANDS COUNT
========================================= */
export const getVendorBrandsCount = async (vendor_id, srch_brand_name = "", brand_status = undefined) => {
  const whereCondition = {
    vendor_id: vendor_id,
    tbl_brand_id: { [Op.ne]: 0 },
  };

  const brandWhere = {};
  if (srch_brand_name) {
    brandWhere.brand_name = {
      [Op.like]: `%${srch_brand_name}%`,
    };
  }
  // Apply brand_status filter on Brand (tbl_brand.status) when provided
  if (brand_status !== undefined && brand_status !== "") {
    brandWhere.status = parseInt(brand_status, 10);
  }

  // 1) Relation counts (pending/approved/declined) filtered by Brand.status when brand_status provided
  const relationRows = await VendorBrandRelation.findAll({
    attributes: [
      "status",
      [sequelize.fn("COUNT", sequelize.col("VendorBrandRelation.id")), "count"],
    ],
    where: whereCondition,
    include: [
      {
        model: Brand,
        required: !!(srch_brand_name || brand_status),
        where: Object.keys(brandWhere).length ? brandWhere : undefined,
        attributes: [],
      },
    ],
    group: ["VendorBrandRelation.status"],
    raw: true,
  });

  const relationCounts = { all: 0, pending: 0, approved: 0, declined: 0 };
  for (const rawData of relationRows) {
    const n = Number(rawData.count) || 0;
    relationCounts.all += n;
    if (rawData.status === 0) relationCounts.pending += n;
    else if (rawData.status === 1) relationCounts.approved += n;
    else if (rawData.status === 2) relationCounts.declined += n;
  }

  // 2) Brand-status counts (active/inactive/all) among brands related to this vendor (and matching search)
  // Fetch brand ids for this vendor (apply srch_brand_name and brand_status if provided)
  const relationFilter = {
    vendor_id: vendor_id,
    tbl_brand_id: { [Op.ne]: 0 },
  };

  const vendorRows = await VendorBrandRelation.findAll({
    attributes: ["tbl_brand_id"],
    where: relationFilter,
    include: [
      {
        model: Brand,
        required: !!(srch_brand_name || brand_status),
        where: Object.keys(brandWhere).length ? brandWhere : undefined,
        attributes: ["brand_id"],
      },
    ],
    raw: true,
  });

  const brandIds = Array.from(new Set(vendorRows.map(r => r.tbl_brand_id).filter(Boolean)));

  const brandStatusCounts = { all: 0, active: 0, inactive: 0 };
  if (brandIds.length > 0) {
    const brandRows = await Brand.findAll({
      attributes: ["status", [sequelize.fn("COUNT", sequelize.col("brand_id")), "count"]],
      where: {
        brand_id: { [Op.in]: brandIds },
      },
      group: ["status"],
      raw: true,
    });

    for (const b of brandRows) {
      const n = Number(b.count) || 0;
      brandStatusCounts.all += n;
      if (b.status === 1) brandStatusCounts.active += n;
      else brandStatusCounts.inactive += n;
    }
  }

  // Return both counts so frontend can use relationCounts or brandStatusCounts as needed
  return {
    relationCounts,
    brandStatusCounts,
  };
};

/* =========================================
   GET FULL BRAND DETAILS BY ID (FOR EDIT)
========================================= */
export const getBrandById = async (vendor_id, brand_id) => {
  const brand = await Brand.findOne({
    attributes: ["brand_name", "description", "image", "status"],
    where: { brand_id: brand_id },
    include: [
      {
        model: VendorBrandRelation,
        required: true, // Strict requirement ensuring permissions organically
        where: { vendor_id: vendor_id },
        attributes: ["status"],
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

  const plainBrand = brand.get({ plain: true });
  const info = plainBrand.BrandInfo || {};

  // Fetch counts separately to keep it simple and clean for single brand view
  const [productCount, leadCount] = await Promise.all([
    Product.count({
      where: { brand_id: brand_id, is_deleted: 0 },
    }),
    TblLeads.count({
      where: { brand_id: brand_id },
    }),
  ]);

  return {
    brand_name: plainBrand.brand_name,
    description: plainBrand.description,
    image: plainBrand.image,
    status: plainBrand.status,
    brand_status: plainBrand.status,
    tbl_info_id: info.id || null,
    information: info.information,
    founded_on: info.founded_on,
    founders: info.founders,
    company_size: info.company_size,
    location: info.location,
    industry: info.industry,
    total_product: productCount,
    total_leads: leadCount,
    vendor_status: plainBrand.VendorBrandRelations?.[0]?.status ?? null,
  };
};

export const handleViewBrand = async (brand_id, vendor_id) => {
  const data = await getBrandById(vendor_id, brand_id);

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
   GET BRAND LOCATION
========================================= */
export const getBrandLocation = async (brand_id) => {
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

export const handleUpdateBrand = async (brand_id, body, file, vendor_id, profile_id) => {
  const transaction = await sequelize.transaction();

  try {
    const brandDetails = await getBrandById(vendor_id, brand_id);

    if (!brandDetails) {
      throw new AppError("Brand not found", 404);
    }

    const { brand_name, information, location, industry, founded_on, founders, company_size } = body;

    let imageName = null;
    if (file) {
      // Sanitize and build S3 filename that includes brand_id
      const originalName = file.originalname.replace(/[^a-zA-Z0-9._]+/g, "");
      const fileName = `${brand_id}_${originalName}`;
      const fileobj = {
        ...file,
        originalname: fileName,
        key: `web/assets/images/techjockey/brands/${fileName}`,
      };
      await uploadfile2(fileobj);
      imageName = fileName;
    }

    const brandSave = {
      brand_name,
      location,
      information,
      industry,
      founded_on,
      founders,
      company_size,
      ...(imageName !== null && { image: imageName }),
    };

    const brandDiff = findDifferences(brandDetails, brandSave);

    if (brandDiff && Object.keys(brandDiff).length > 0) {
      const flatLogArr = Object.entries(brandDiff).map(([col, values]) => {
        const isCore = col === "brand_name" || col === "image";
        return {
          item_id: brand_id,
          module: "brand",
          action_performed: "updated",
          action_by: profile_id,
          table_name: isCore ? "tbl_brand" : "tbl_brand_info",
          column_name: col,
          p_key: isCore ? "brand_id" : "id",
          updated_column_value: values.new !== null && values.new !== undefined ? values.new.toString() : "",
          linked_attribute: "",
          item_updated_id: brand_id,
          reject_reason: "",
          status: 0,
          created_at: new Date(),
          updated_at: new Date(),
        };
      });
      await VendorLog.bulkCreate(flatLogArr, { transaction });
    }

    await transaction.commit();
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

/* =========================================
   REQUEST BRAND LOGIC
========================================= */

export const handleRequestBrand = async (brandIdsArray, vendorId) => {
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

/* =========================================
   SEARCH GLOBAL BRANDS FOR REQUEST
========================================= */
export const handleSearchBrandsForRequest = async (vendorId, searchStr = "") => {
  try {
    // 1. Get all brand IDs already associated with this vendor
    const existingRelations = await VendorBrandRelation.findAll({
      attributes: ["tbl_brand_id"],
      where: { vendor_id: vendorId },
      raw: true,
    });

    const excludedIds = existingRelations.map((r) => r.tbl_brand_id).filter(Boolean);

    // 2. Fetch brands not in the excluded list
    const brands = await Brand.findAll({
      attributes: [
        ["brand_id", "id"],
        ["brand_name", "text"],
      ],
      where: {
        status: 1,
        is_deleted: 0,
        brand_name: {
          [Op.like]: `%${searchStr}%`,
        },
        // Only apply NOT IN if there are IDs to exclude
        ...(excludedIds.length > 0 && {
          brand_id: {
            [Op.notIn]: excludedIds,
          },
        }),
      },
      raw: true,
    });

    return brands;
  } catch (error) {
    throw error;
  }
};
