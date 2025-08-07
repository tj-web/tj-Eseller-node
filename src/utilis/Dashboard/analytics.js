import sequelize from "../../db/connection.js";
import { analyticsConfig } from "../../config/analytics.config.js";
import { thousandsCurrencyFormat, formatTime } from "../../helpers/format.js";

// Get OMS PI data (only if show_current_plan_data == 1)
const getOmsPiData = async (vendor_id) => {
  try {
    const results = await sequelize.query(
      `
      SELECT opd.id, opd.start_date, opd.end_date
      FROM oms_pi_details opd
      LEFT JOIN tbl_leads_plan tlp ON tlp.id = opd.lead_plan_id
      WHERE tlp.plan_type = 'credit'
        AND opd.vendor_id = :vendor_id
        AND CURDATE() BETWEEN opd.start_date AND opd.end_date
        AND opd.total_lead >= opd.used_lead
        AND opd.pi_status = 3
      ORDER BY opd.id DESC
      `,
      {
        replacements: { vendor_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    return results;
  } catch (err) {
    console.error(" getOmsPiData error:", err);
    return [];
  }
};

// Get analytics data (raw SQL placeholder)
const getAnalyticsData = async (filter) => {
  try {
    const query = `
  SELECT 
    SUM(total_leads) AS total_leads,
    SUM(impression) AS impression,
    SUM(pageviews) AS pageviews,
    SUM(total_requests) AS total_requests,
    ROUND((SUM(utilised_leads) * 100) / NULLIF(SUM(total_leads), 0)) AS total_utilisation
  FROM vendor_analytics
  WHERE vendor_id = :vendor_id
`;

    const replacements = { vendor_id: filter.vendor_id };

    if (filter.days_filter && Number(filter.days_filter) > 0) {
      query += ` AND DATE(logic_date) >= :date_condition`;
      const date = new Date();
      date.setDate(date.getDate() - Number(filter.days_filter));
      replacements.date_condition = date.toISOString().split("T")[0]; // YYYY-MM-DD
    }

    const [result] = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    return result;
  } catch (err) {
    console.error(" getAnalyticsData error:", err);
    throw err;
  }
};

// Main function
export const analyticsInfo = async (filter) => {
  try {
    let oms_pi_data = [];

    if (filter.show_current_plan_data == 1) {
      oms_pi_data = await getOmsPiData(filter.vendor_id);
      if (oms_pi_data.length > 0) {
        filter.oms_pi_filter = oms_pi_data;
      }
    }

    const analytics_data = await getAnalyticsData({
      vendor_id: filter.vendor_id,
      days_filter: filter.days_filter, // pass from req.query if applicable
    });

    const response = [
      {
        type: analyticsConfig.impression.type,
        hasData: analyticsConfig.impression.hasData,
        heading: analyticsConfig.impression.heading,
        data: thousandsCurrencyFormat(analytics_data.impression),
        info: analyticsConfig.impression.info,
        icon: analyticsConfig.impression.icon,
      },
      {
        type: analyticsConfig.pageviews.type,
        hasData: analyticsConfig.pageviews.hasData,
        heading: analyticsConfig.pageviews.heading,
        data: analytics_data.pageviews,
        info: analyticsConfig.pageviews.info,
        icon: analyticsConfig.pageviews.icon,
      },
      {
        type: analyticsConfig.requests.type,
        hasData: analyticsConfig.requests.hasData,
        heading: analyticsConfig.requests.heading,
        data: analytics_data.total_requests,
        info: analyticsConfig.requests.info,
        icon: analyticsConfig.requests.icon,
      },
      {
        type: analyticsConfig.avg_attemp_time.type,
        hasData: analyticsConfig.avg_attemp_time.hasData,
        heading: analyticsConfig.avg_attemp_time.heading,
        data: formatTime(analytics_data.avg_attemp_time),
        info: analyticsConfig.avg_attemp_time.info,
        icon: analyticsConfig.avg_attemp_time.icon,
      },
      {
        type: analyticsConfig.total_utilisation.type,
        hasData: analyticsConfig.total_utilisation.hasData,
        heading: analyticsConfig.total_utilisation.heading,
        data: `${analytics_data.total_utilisation || 0}%`,
        info: analyticsConfig.total_utilisation.info,
        icon: analyticsConfig.total_utilisation.icon,
      },
    ];

    return {
      show_analytics: true,
      analytics: response,
    };
  } catch (error) {
    console.error(" Error in analyticsInfo:", error);
    throw error;
  }
};
