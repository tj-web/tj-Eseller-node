import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import ProductCategory from "../models/productCategory.model.js";
import Category from "../models/category.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const renderBuyerActivityTemplate = async (templateNumber, data = {}) => {
  const templatePath = path.join(
    __dirname,
    `../templates/buyerActivityTemplates/template${templateNumber}.ejs`
  );

  const renderedText = await ejs.renderFile(templatePath, data);

  return renderedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

/**
 * Fetches the category hierarchy for a product:
 * - Direct mapping from tbl_product_category as primaryCategory.
 * - Downward child categories from tbl_category (parent_id = mappedCategoryId).
 * - Secondary mappings from tbl_product_category (is_primary = 0).
 * - If no category mapping exists, returns null (no generic 'Software' fallback).
 */
export const fetchProductCategoryHierarchy = async (lead) => {
  try {
    const productId = lead?.product_id;
    const leadCategoryId = lead?.category_id;

    let mappedCategories = [];

    // 1. Fetch mapped categories for this product if product_id exists
    if (productId) {
      mappedCategories = await ProductCategory.findAll({
        where: { product_id: productId },
        include: [
          {
            model: Category,
            attributes: ["category_id", "category_name", "parent_id"],
            where: { status: 1, is_deleted: 0 }
          }
        ],
        order: [["is_primary", "DESC"], ["sort_order", "ASC"]],
        raw: true,
        nest: true
      });
    }

    let primaryCategoryName = null;
    let mappedCategoryId = leadCategoryId || null;
    let secondaryCategories = [];

    if (mappedCategories && mappedCategories.length > 0) {
      const primaryMapping = mappedCategories.find((m) => m.is_primary === 1) || mappedCategories[0];
      const primaryCat = primaryMapping.Category;

      primaryCategoryName = primaryCat?.category_name || null;
      mappedCategoryId = primaryCat?.category_id || null;

      // Extract secondary mapped categories
      secondaryCategories = mappedCategories
        .filter((m) => m.is_primary !== 1 && m.Category?.category_name)
        .map((m) => m.Category.category_name);
    } else if (leadCategoryId) {
      // Fallback: look up category from lead.category_id directly
      const catRow = await Category.findByPk(leadCategoryId, {
        attributes: ["category_id", "category_name", "parent_id"],
        raw: true
      });
      if (catRow) {
        primaryCategoryName = catRow.category_name;
        mappedCategoryId = catRow.category_id;
      }
    }

    // 2. Fetch Child categories where parent_id = mappedCategoryId (look downwards)
    let childCategories = [];
    if (mappedCategoryId) {
      const childRows = await Category.findAll({
        attributes: ["category_name"],
        where: { parent_id: mappedCategoryId, status: 1, is_deleted: 0 },
        order: [["sort_order", "ASC"], ["category_name", "ASC"]],
        limit: 10,
        raw: true
      });

      childCategories = childRows.map((c) => c.category_name).filter(Boolean);
    }

    return {
      primaryCategory: primaryCategoryName,
      childCategories,
      secondaryCategories
    };
  } catch (error) {
    console.error("Error fetching product category hierarchy:", error);
    return {
      primaryCategory: null,
      childCategories: [],
      secondaryCategories: []
    };
  }
};

/**
 * Maps numeric lead IDs to non-sequential buckets (0 to 6).
 * Uses bitwise scrambling for 100% deterministic, pseudo-random output.
 */
export const getNumericBucket = (leadId) => {
  let id = Number(leadId) || 0;

  // Scramble bits using XOR, bit shifts, and 32-bit prime multiplication
  id = Math.imul(id ^ 0x45d9f3b, 0x45d9f3b);
  id = Math.imul((id >>> 16) ^ id, 0x45d9f3b);
  id = (id >>> 16) ^ id;

  // Ensure unsigned 32-bit integer and map to 0–6
  return (id >>> 0) % 7;
};

/**
 * Returns deterministic template index (1 to 7) for a given leadId.
 */
export const getTemplate = (leadId) => {
  return getNumericBucket(leadId) + 1;
};

/**
 * Generates the deterministic Buyer Activity Timeline for a non-website lead.
 * Omits any template lines for which category or product information is not available.
 */
export const getDeterministicBuyerActivityTimeline = async (lead) => {
  const templateNumber = getTemplate(lead?.id);

  // Fetch category hierarchy
  const { primaryCategory, childCategories, secondaryCategories } =
    await fetchProductCategoryHierarchy(lead);

  // Distinct child and secondary selections (null if no distinct category exists)
  const child1 = childCategories[0] || secondaryCategories[0] || null;
  const child2 = childCategories[1] || secondaryCategories[1] || (secondaryCategories[0] && secondaryCategories[0] !== child1 ? secondaryCategories[0] : null);
  const secondary1 = secondaryCategories[0] || (childCategories.length > 1 ? childCategories[childCategories.length - 1] : null);

  const vendorProduct = lead?.product_name || null;

  // Build template payload
  const templateData = {
    primaryCategory: primaryCategory || null,
    childCategory: child1,
    childCategory1: child1,
    childCategory2: child2,
    secondaryCategory: secondary1,
    vendorProduct
  };

  // Render template to get actions (empty lines from missing variables are omitted)
  const actions = await renderBuyerActivityTemplate(templateNumber, templateData);

  return actions.map((action) => ({ action }));
};
