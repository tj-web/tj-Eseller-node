import sequelize from "../config/connection.js";

export const getDesignation = async () => {
  try {
    const [results] = await sequelize.query(`
      SELECT id, designation
      FROM tbl_designation
      WHERE status = 1 AND is_deleted = 0
    `);

    return results;
  } catch (error) {
    console.error("Error fetching designations:", error);
    throw error;
  }
};

export const getVendorById = async (profile_id) => {
  try {
    const [result] = await sequelize.query(
      `SELECT id, vendor_id, first_name, last_name, email
       FROM vendor_auth
       WHERE id = :profile_id`,
      {
        replacements: { profile_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return result || null;
  } catch (error) {
    console.error("Error fetching vendor by ID:", error);
    throw error;
  }
};

export const getVendorDetailById = async (vendor_id) => {
  try {
    const [result] = await sequelize.query(
      `SELECT designation, company, company_address, website
       FROM vendor_details
       WHERE vendor_id = :vendor_id`,
      {
        replacements: { vendor_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return result || null;
  } catch (error) {
    console.error("Error fetching vendor details by ID:", error);
    throw error;
  }
};

export const getVendorAgreement = async (vendor_id, version) => {
  try {
    const [result] = await sequelize.query(
      `SELECT id, vendor_id, first_name, last_name, company, company_address, place,
              agreement_date, agreement_by, agreement_doc, is_signed
       FROM vendor_agreement
       WHERE vendor_id = :vendor_id AND version = :version
       ORDER BY id DESC
       LIMIT 1`,
      {
        replacements: { vendor_id, version },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return result || null;
  } catch (error) {
    console.error("Error fetching vendor agreement:", error);
    throw error;
  }
};

export const isPreviousSigned = async (version, vendor_id) => {
  try {
    const result = await sequelize.query(
      `SELECT COUNT(*) AS count
       FROM vendor_agreement
       WHERE version = :version AND vendor_id = :vendor_id`,
      {
        replacements: { version, vendor_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return result[0].count;
  } catch (error) {
    console.error("Error checking previous signed agreement:", error);
    throw error;
  }
};

export const getVendorBrands = async (vendor_id) => {
  try {
    const results = await sequelize.query(
      `SELECT vbr.tbl_brand_id 
       FROM vendor_brand_relation AS vbr
       INNER JOIN tbl_brand AS tb ON tb.brand_id = vbr.tbl_brand_id
       WHERE vbr.tbl_brand_id != 0 
         AND vbr.vendor_id = :vendor_id
         AND (vbr.status = 1 OR (tb.added_by = 'vendor' AND tb.added_by_id = :vendor_id))`,
      {
        replacements: { vendor_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return results.map((row) => row.tbl_brand_id);
  } catch (error) {
    console.error("Error fetching vendor brands:", error);
    throw error;
  }
};

export const getBrands = async (vendor_id) => {
  try {
    const brandArr = await getVendorBrands(vendor_id);

    if (!brandArr || brandArr.length === 0) {
      return [];
    }

    const results = await sequelize.query(
      `SELECT brand_id, brand_name, commission_type, commission, 
              renewal_terms, payment_terms, payment_terms_comment
       FROM tbl_brand
       WHERE brand_id IN (:brandArr)`,
      {
        replacements: { brandArr },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return results;
  } catch (error) {
    console.error("Error fetching brands:", error);
    throw error;
  }
};

//   try {
//     let finalData = {};

//     // Step 1: Get brand IDs for this vendor
//     const brandArr = await getVendorBrands(vendor_id);

//     if (!brandArr || brandArr.length === 0) {
//       return finalData; // empty result
//     }

//     // Step 2: Run raw query (no destructuring!)
//     const results = await sequelize.query(
//       `SELECT
//           tp.product_id,
//           tp.product_name,
//           tp.status,
//           tb.brand_name,
//           tp.commission_type,
//           tp.commission,
//           tp.renewal_terms,
//           tp.payment_terms,
//           tp.payment_terms_comment,
//           plan.plan_name,
//           plan.tp_commission_type AS plan_tp_commission_type,
//           plan.tp_commission AS plan_tp_commission
//        FROM tbl_product AS tp
//        LEFT JOIN tbl_plan AS plan ON plan.product_id = tp.product_id
//        LEFT JOIN tbl_brand AS tb ON tb.brand_id = tp.brand_id
//        WHERE tp.brand_id IN (:brandArr)`,
//       {
//         replacements: { brandArr },
//         type: sequelize.QueryTypes.SELECT,
//       }
//     );

//     // Step 3: Rebuild data structure like in PHP
//     results.forEach((product) => {
//       if (!finalData[product.product_id]) {
//         finalData[product.product_id] = {
//           product_id: product.product_id,
//           product_name: product.product_name,
//           status: product.status,
//           brand_name: product.brand_name,
//           commission_type: product.commission_type,
//           commission: product.commission,
//           renewal_terms: product.renewal_terms,
//           payment_terms: product.payment_terms,
//           payment_terms_comment: product.payment_terms_comment,
//           plans: [],
//         };
//       }

//       if (product.plan_name) {
//         finalData[product.product_id].plans.push({
//           plan_name: product.plan_name,
//           tp_commission_type: product.plan_tp_commission_type,
//           tp_commission: product.plan_tp_commission,
//         });
//       }
//     });

//     return finalData;
//   } catch (error) {
//     console.error("Error fetching agreement product plans:", error);
//     throw error;
//   }
// };

// export const getAgreementProductPlans = async (vendor_id) => {
//   try {
//     // 1. Get vendor's brands
//     const brandArr = await getVendorBrands(vendor_id);

//     if (!brandArr || brandArr.length === 0) {
//       return [];
//     }

//     // 2. Run raw query with JOINs
//     const query = `
//       SELECT
//         tp.product_id,
//         tp.product_name,
//         tp.status,
//         tb.brand_name,
//         tp.commission_type,
//         tp.commission,
//         tp.renewal_terms,
//         tp.payment_terms,
//         tp.payment_terms_comment,
//         plan.plan_name,
//         plan.tp_commission_type AS plan_tp_commission_type,
//         plan.tp_commission AS plan_tp_commission
//       FROM tbl_product AS tp
//       LEFT JOIN tbl_plan AS plan ON plan.product_id = tp.product_id
//       LEFT JOIN tbl_brand AS tb ON tb.brand_id = tp.brand_id
//       WHERE tp.brand_id IN (:brandArr)
//     `;

//     const results = await sequelize.query(query, {
//       replacements: { brandArr },
//       type: sequelize.QueryTypes.SELECT,
//     });

//     // 3. Transform results into nested structure (group by product_id)
//     const finalData = {};

//     results.forEach(product => {
//       if (!finalData[product.product_id]) {
//         finalData[product.product_id] = {
//           product_id: product.product_id,
//           product_name: product.product_name,
//           status: product.status,
//           brand_name: product.brand_name,
//           commission_type: product.commission_type,
//           commission: product.commission,
//           renewal_terms: product.renewal_terms,
//           payment_terms: product.payment_terms,
//           payment_terms_comment: product.payment_terms_comment,
//           plans: []
//         };
//       }

//       // Add plan if exists
//       if (product.plan_name) {
//         finalData[product.product_id].plans.push({
//           plan_name: product.plan_name,
//           tp_commission_type: product.plan_tp_commission_type,
//           tp_commission: product.plan_tp_commission
//         });
//       }
//     });

//     return Object.values(finalData); // return as array instead of object
//   } catch (error) {
//     console.error("Error fetching agreement product plans:", error);
//     throw error;
//   }
// };

export const getAgreementProductPlans = async (vendor_id) => {
  try {
    const finalData = {};

    const brandArr = await getVendorBrands(vendor_id);

    if (brandArr && brandArr.length > 0) {
      const results = await sequelize.query(
        `
        SELECT 
          tp.product_id,
          tp.product_name,
          tp.status,
          tb.brand_name,
          tp.commission_type,
          tp.commission,
          tp.renewal_terms,
          tp.payment_terms,
          tp.payment_terms_comment,
          plan.plan_name,
          plan.id AS plan_id,
          plan.tp_commission_type AS plan_tp_commission_type,
          plan.tp_commission AS plan_tp_commission
        FROM tbl_product AS tp
        LEFT JOIN tbl_plan AS plan 
          ON plan.product_id = tp.product_id
        LEFT JOIN tbl_brand AS tb 
          ON tb.brand_id = tp.brand_id
        WHERE tp.brand_id IN (:brandArr)
          AND tp.is_deleted = 0
          AND tp.status = 1
          AND tb.is_deleted = 0
          AND tb.status = 1
          AND tp.show_status = 1
          AND tb.show_status = 1
          AND plan.status = 1
        `,
        {
          replacements: { brandArr },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (results.length > 0) {
        const planIds = results
          .map((row) => row.plan_id)
          .filter((id) => id !== null && id !== undefined);

        const planSpecsDetails = await getPlanRelatedSpecs(planIds);

        results.forEach((product) => {
          if (!finalData[product.product_id]) {
            finalData[product.product_id] = {
              product_id: product.product_id,
              product_name: product.product_name,
              status: product.status,
              brand_name: product.brand_name,
              commission_type: product.commission_type,
              commission: product.commission,
              renewal_terms: product.renewal_terms,
              payment_terms: product.payment_terms,
              payment_terms_comment: product.payment_terms_comment,
              plans: [],
            };
          }

          if (product.plan_name) {
            finalData[product.product_id].plans.push({
              plan_id: product.plan_id,
              plan_name: product.plan_name,
              tp_commission_type: product.plan_tp_commission_type,
              tp_commission: product.plan_tp_commission,
              specs:
                planSpecsDetails && planSpecsDetails[product.plan_id]
                  ? planSpecsDetails[product.plan_id]
                  : [],
            });
          }
        });
      }
    }

    return finalData;
  } catch (error) {
    console.error("Error in getAgreementProductPlans:", error);
    throw error;
  }
};

export const getPlanRelatedSpecs = async (plan_ids) => {
  try {
    if (!Array.isArray(plan_ids) || plan_ids.length === 0) {
      return {};
    }

    const results = await sequelize.query(
      `
      SELECT 
        tps.plan_id, 
        tps.spec_name, 
        tps.transfer_price
      FROM tbl_plan_spec AS tps
      WHERE tps.plan_id IN (:plan_ids)
        AND tps.status = 1
      `,
      {
        replacements: { plan_ids },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const resultArray = {};
    results.forEach((row) => {
      if (!resultArray[row.plan_id]) {
        resultArray[row.plan_id] = [];
      }
      resultArray[row.plan_id].push(row);
    });

    return resultArray;
  } catch (error) {
    console.error("Error in getPlanRelatedSpecs:", error);
    throw error;
  }
};
