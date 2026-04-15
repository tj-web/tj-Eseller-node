import { Op } from "sequelize";
// import Designation from "./designation.js";
import Designation from "../models/designation.js";
import VendorAuth from "../models/auth/vendorAuth.js";
import VendorDetails from "../models/vendorDetails.js";
import VendorAgreement from "../models/vendorAgreement.js";
import VendorBrandRelation from "../models/vendorBrandRelation.js";
import Brand from "../models/brand.js";
import Product from "../models/product.js";
import Plan from "../models/plan.js";
import TblPlanSpec from "../models/planSpec.js";

// --- Establish temporary relationships for these queries ---
VendorBrandRelation.belongsTo(Brand, { foreignKey: "tbl_brand_id", targetKey: "brand_id" });
Product.hasMany(Plan, { foreignKey: "product_id", sourceKey: "product_id" });
Product.belongsTo(Brand, { foreignKey: "brand_id", targetKey: "brand_id" });

export const getDesignation = async () => {
  try {
    const results = await Designation.findAll({
      attributes: ['id', 'designation'],
      where: {
        status: 1,
        is_deleted: 0
      },
      raw: true
    });
    return results;
  } catch (error) {
    throw error;
  }
};

export const getVendorById = async (profile_id) => {
  try {
    const result = await VendorAuth.findOne({
      attributes: ['id', 'vendor_id', 'first_name', 'last_name', 'email'],
      where: { id: profile_id },
      raw: true
    });
    return result || null;
  } catch (error) {
    console.error("Error fetching vendor by ID:", error);
    throw error;
  }
};

export const getVendorDetailById = async (vendor_id) => {
  try {
    const result = await VendorDetails.findOne({
      attributes: ['designation', 'company', 'company_address', 'website'],
      where: { vendor_id },
      raw: true
    });
    return result || null;
  } catch (error) {
    throw error;
  }
};

export const getVendorAgreement = async (vendor_id, version) => {
  try {
    const result = await VendorAgreement.findOne({
      attributes: [
        'id', 'vendor_id', 'first_name', 'last_name', 'company',
        'company_address', 'place', 'agreement_date', 'agreement_by',
        'agreement_doc', 'is_signed'
      ],
      where: { vendor_id, version },
      order: [['id', 'DESC']],
      raw: true
    });
    return result || null;
  } catch (error) {
    throw error;
  }
};

export const isPreviousSigned = async (version, vendor_id) => {
  try {
    const count = await VendorAgreement.count({
      where: { version, vendor_id }
    });
    return count;
  } catch (error) {
    throw error;
  }
};

export const getVendorBrands = async (vendor_id) => {
  try {
    const relations = await VendorBrandRelation.findAll({
      attributes: ['tbl_brand_id', 'status'],
      where: {
        vendor_id,
        tbl_brand_id: { [Op.ne]: 0 }
      },
      include: [{
        model: Brand,
        attributes: ['added_by', 'added_by_id'],
        required: true
      }],
      raw: true,
      nest: true
    });

    const validBrandIds = [];
    for (const rel of relations) {
      if (
        rel.status === 1 || 
        (rel.Brand && rel.Brand.added_by === 'vendor' && Number(rel.Brand.added_by_id) === Number(vendor_id))
      ) {
        validBrandIds.push(rel.tbl_brand_id);
      }
    }
    return validBrandIds;
  } catch (error) {
    throw error;
  }
};

export const getBrands = async (vendor_id) => {
  try {
    const brandArr = await getVendorBrands(vendor_id);
    if (!brandArr || brandArr.length === 0) {
      return [];
    }

    const results = await Brand.findAll({
      attributes: [
        'brand_id', 'brand_name', 'commission_type', 'commission',
        'renewal_terms', 'payment_terms', 'payment_terms_comment'
      ],
      where: { brand_id: brandArr },
      raw: true
    });
    return results;
  } catch (error) {
    throw error;
  }
};

export const getAgreementProductPlans = async (vendor_id) => {
  try {
    const brandArr = await getVendorBrands(vendor_id);
    if (!brandArr || brandArr.length === 0) {
      return {};
    }

    const products = await Product.findAll({
      attributes: [
        'product_id', 'product_name', 'status', 'commission_type', 'commission',
        'renewal_terms', 'payment_terms', 'payment_terms_comment'
      ],
      where: {
        brand_id: brandArr,
        is_deleted: 0,
        status: 1,
        show_status: 1
      },
      include: [
        {
          model: Brand,
          attributes: ['brand_name'],
          where: { is_deleted: 0, status: 1, show_status: 1 },
          required: true
        },
        {
          model: Plan,
          attributes: ['id', 'plan_name', 'tp_commission_type', 'tp_commission'],
          where: { status: 1 },
          required: false // LEFT JOIN
        }
      ],
      raw: true,
      nest: true
    });

    if (products.length === 0) return {};

    const planIds = products
      .map(p => p.tbl_plans?.id)
      .filter(id => id !== null && id !== undefined);

    const planSpecsDetails = await getPlanRelatedSpecs(planIds);
    const finalData = {};

    products.forEach(product => {
      if (!finalData[product.product_id]) {
        finalData[product.product_id] = {
          product_id: product.product_id,
          product_name: product.product_name,
          status: product.status,
          brand_name: product.Brand?.brand_name,
          commission_type: product.commission_type,
          commission: product.commission,
          renewal_terms: product.renewal_terms,
          payment_terms: product.payment_terms,
          payment_terms_comment: product.payment_terms_comment,
          plans: []
        };
      }

      if (product.tbl_plans && product.tbl_plans.plan_name) {
        const planId = product.tbl_plans.id;
        finalData[product.product_id].plans.push({
          plan_id: planId,
          plan_name: product.tbl_plans.plan_name,
          tp_commission_type: product.tbl_plans.tp_commission_type,
          tp_commission: product.tbl_plans.tp_commission,
          specs: planSpecsDetails[planId] || []
        });
      }
    });

    return finalData;
  } catch (error) {
    throw error;
  }
};

export const getPlanRelatedSpecs = async (plan_ids) => {
  try {
    if (!Array.isArray(plan_ids) || plan_ids.length === 0) {
      return {};
    }

    const specs = await TblPlanSpec.findAll({
      attributes: ['plan_id', 'spec_name', 'transfer_price'],
      where: {
        plan_id: plan_ids,
        status: 1
      },
      raw: true
    });

    const resultArray = {};
    specs.forEach(row => {
      if (!resultArray[row.plan_id]) {
        resultArray[row.plan_id] = [];
      }
      resultArray[row.plan_id].push(row);
    });

    return resultArray;
  } catch (error) {
    throw error;
  }
};