import { analytics, showAnalytics } from "../utilis/common.js";
import sequelize from "../config/connection.js";
export const getVendorProductIds = async (vendorId) => {
  try {
    const brandResults = await sequelize.query(
      `
      SELECT vbr.tbl_brand_id
      FROM vendor_brand_relation AS vbr
      INNER JOIN tbl_brand AS tb ON tb.brand_id = vbr.tbl_brand_id
      WHERE vbr.tbl_brand_id != 0
        AND vbr.vendor_id = :vendorId
        AND (
          vbr.status = 1
          OR (tb.added_by = 'vendor' AND tb.added_by_id = :vendorId)
        )
      `,
      {
        replacements: { vendorId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const brandIds = brandResults.map((row) => row.tbl_brand_id);

    if (brandIds.length === 0) {
      return { brandIds: [], productIds: [], priceAvailable: 1 };
    }

    // Step 2: Get product IDs
    const productResults = await sequelize.query(
      `
      SELECT tp.product_id
      FROM tbl_product AS tp
      WHERE tp.brand_id IN (:brandIds)
        AND tp.is_deleted = 0
        AND tp.status = 1
        AND tp.show_status = 1
      `,
      {
        replacements: { brandIds },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const productIds = productResults.map((row) => row.product_id);

    if (productIds.length === 0) {
      return { brandIds, productIds: [], priceAvailable: 1 };
    }

    // Step 3: Check price availability
    const priceResults = await sequelize.query(
      `
      SELECT price
      FROM tbl_product
      WHERE price_on_request = 1
        AND product_id IN (:productIds)
      `,
      {
        replacements: { productIds },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const priceAvailable = priceResults.length > 0 ? 0 : 1;

    return { productIds, priceAvailable };
  } catch (error) {
    console.error("Error fetching vendor product IDs:", error);
    return { brandIds: [], productIds: [], priceAvailable: 0 };
  }
};

// adjust path

export const getReviewsData = async (productIds) => {
  try {
    if (!productIds.length) {
      return [];
    }

    const results = await sequelize.query(
      `
      SELECT *
      FROM avg_prod_rating_view
      WHERE product_id IN (:productIds)
      `,
      {
        replacements: { productIds },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return results; // already an array of rows
  } catch (error) {
    console.error("Error fetching reviews data:", error);
    return [];
  }
};

//--------------------this will help to us to get the analytics data--------------------

// Helper function like PHP thousandsCurrencyFormat
const thousandsCurrencyFormat = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num;
};

//  Main function to get analytics data
export const getAnalyticsData = async (filter) => {
  try {
    let omsPiFilter = [];

    // Step 1: if show_current_plan_data = 1 → fetch oms_pi_data
    if (filter.show_current_plan_data === 1) {
      const omsResults = await sequelize.query(
        `
        SELECT opd.id, opd.start_date, opd.end_date
        FROM oms_pi_details opd
        LEFT JOIN tbl_leads_plan tlp ON tlp.id = opd.lead_plan_id
        WHERE tlp.plan_type = 'credit'
          AND opd.vendor_id = :vendorId
          AND (CURDATE() BETWEEN opd.start_date AND opd.end_date)
          AND opd.total_lead >= opd.used_lead
          AND opd.pi_status = 3
        ORDER BY opd.id DESC
        `,
        {
          replacements: { vendorId: filter.vendor_id },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (omsResults.length > 0) {
        omsPiFilter = omsResults;
      }
    }

    // Step 2: Build WHERE clause for vendor_analytics
    let whereConditions = `vendor_id = :vendorId`;

    if (filter.filter_start_date && filter.filter_end_date) {
      whereConditions += ` AND logic_date >= :startDate AND logic_date <= :endDate`;
    }

    if (filter.show_current_plan_data === 1 && omsPiFilter.length > 0) {
      const omsConditions = omsPiFilter
        .map(
          (opi) =>
            `(logic_date BETWEEN '${opi.start_date}' AND '${opi.end_date}')`
        )
        .join(" OR ");
      whereConditions += ` AND (${omsConditions})`;
    }

    // Step 3: Query analytics
    const [analyticsResult] = await sequelize.query(
      `
      SELECT 
        SUM(total_leads) AS total_leads,
        SUM(impression) AS impression,
        SUM(pageviews) AS pageviews,
        SUM(total_requests) AS total_requests,
        ROUND(SUM(total_attempt_time)/NULLIF(SUM(total_attempt_lead),0)) AS avg_attemp_time,
        ROUND(((SUM(utilised_leads)*100)/NULLIF(SUM(total_leads),0))) AS total_utilisation
      FROM vendor_analytics
      WHERE ${whereConditions}
      `,
      {
        replacements: {
          vendorId: filter.vendor_id,
          startDate: filter.filter_start_date,
          endDate: filter.filter_end_date,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const analyticsData = analyticsResult || {};

    // Step 4: Prepare response
    const data = {
      show_analytics: showAnalytics,
      analytics: [
        {
          type: analytics.impression.type,
          hasData: analytics.impression.hasData,
          heading: analytics.impression.heading,
          data: thousandsCurrencyFormat(analyticsData.impression || 0),
          info: analytics.impression.info,
          icon: analytics.impression.icon,
        },
        {
          type: analytics.pageviews.type,
          hasData: analytics.pageviews.hasData,
          heading: analytics.pageviews.heading,
          data: analyticsData.pageviews || 0,
          info: analytics.pageviews.info,
          icon: analytics.pageviews.icon,
        },
        {
          type: analytics.requests.type,
          hasData: analytics.requests.hasData,
          heading: analytics.requests.heading,
          data: analyticsData.total_requests || 0,
          info: analytics.requests.info,
          icon: analytics.requests.icon,
        },
        {
          type: analytics.avg_attemp_time.type,
          hasData: analytics.avg_attemp_time.hasData,
          heading: analytics.avg_attemp_time.heading,
          data:
            (analyticsData.avg_attemp_time || 0) > 59
              ? `${(analyticsData.avg_attemp_time || "").toFixed(2)}h`
              : `${analyticsData.avg_attemp_time || ""}m`,
          info: analytics.avg_attemp_time.info,
          icon: analytics.avg_attemp_time.icon,
        },
        {
          type: analytics.total_utilisation.type,
          hasData: analytics.total_utilisation.hasData,
          heading: analytics.total_utilisation.heading,
          data: `${analyticsData.total_utilisation || 0}%`,
          info: analytics.total_utilisation.info,
          icon: analytics.total_utilisation.icon,
        },
      ],
    };

    return data;
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return { show_analytics: showAnalytics, analytics: [] };
  }
};



export const getTotalReviewsCount = async (productIds = [], filters = {}) => {
  if (!productIds.length) return 0;

  let query = `
    SELECT COUNT(tr.review_id) AS num_reviews
    FROM tbl_review tr
    JOIN tbl_product tp ON tr.product_id = tp.product_id
    WHERE tr.status = 1
    AND tr.product_id IN (:productIds)
  `;

  const replacements = { productIds };

  if (filters.productName) {
    query += ` AND tp.product_name = :productName`;
    replacements.productName = filters.productName;
  }

  if (filters.rating) {
    const rating = Math.floor(filters.rating);
    query += ` AND (ROUND(tr.rating) = :rating OR (tr.rating >= :rating AND tr.rating < :ratingPlusOne))`;
    replacements.rating = rating;
    replacements.ratingPlusOne = rating + 1;
  }

  if (filters.date) {
    query += ` AND DATE(tr.created_at) = :date`;
    replacements.date = filters.date;
  }

  const [result] = await sequelize.query(query, {
    replacements,
    type: sequelize.QueryTypes.SELECT,
  });

  return result?.num_reviews || 0;
};
