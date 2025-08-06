import { oemTotalLeadsCountInfo } from "../utilis/dashboard.js";
//sniih eovehiv eaybevbe
import sequelize from "../db/connection.js";
export const totalLeadsCountInfo = async (req, res) => {
  try {
    const {
      // filter_start_date,
      // filter_end_date,
      vendor_id,
      // show_current_plan_data,
    } = req.query;

    const result = await oemTotalLeadsCountInfo({
      // filter_start_date,
      // filter_end_date,
      vendor_id,
      // show_current_plan_data,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in oemTotalLeadsCountInfo:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// complete profile overview with the manager data 
export const getVendorOverview = async (req, res) => {
  try {
    const { vendor_id } = req.query;

    if (!vendor_id) {
      return res.status(400).json({ message: "vendor_id is required" });
    }`+-`

    // Get Manager Data
    const [managerData] = await sequelize.query(
      `
       SELECT 
    au.adminusers_name AS name,
    au.adminusers_email AS email,
    au.adminusers_image AS image,
    au.adminusers_phone AS phone
  FROM vendors v
  LEFT JOIN tbl_adminusers au ON au.adminusers_id = v.acc_manager_id
  WHERE v.id = :vendor_id
  `,
      {
        replacements: { vendor_id: Number(vendor_id) },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    
    const manager_data = {
      manager_name: managerData?.name ?? null,
      manager_email: managerData?.email ?? null,
      manager_phone: managerData?.phone ?? null,
      manager_img: managerData?.image ?? null,
    };

    // Get Profile Score
    const [scoreData] = await sequelize.query(
      `
      SELECT particular_score 
      FROM vendors 
      WHERE id = :vendor_id
      `,
      {
        replacements: { vendor_id: Number(vendor_id) },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const profileScore = scoreData?.particular_score
      ? Math.round(scoreData.particular_score)
      : 0;

    // Final merged response
    return res.status(200).json({
      manager_data,
      profile_score: profileScore,
    });
  } catch (error) {
    console.error("Error in vendor overview:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//analytics data function 

import { analyticsInfo } from "../utilis/analytics.js";

export const analyticsCount = async (req, res) => {
  try {
    const filter = {
      vendor_id: req.query.vendor_id,
      show_current_plan_data: req.query.show_current_plan_data || 0,
    };

    const result = await analyticsInfo(filter);
    return res.status(200).json(result);
  } catch (error) {
    console.error(" Error in analyticsCount:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



import { getOemPlansWithRawSQL } from '../utilis/oemService.js';
import { prepareOemPlansData } from '../helpers/oemHelper.js';

export const fetchPlansInfo = async (req, res) => {
  const { fetch_plans_info, vendor_id } = req.query;

  if (fetch_plans_info == 1) {
    try {
      const rawPlans = await getOemPlansWithRawSQL(vendor_id);
      const preparedPlans = prepareOemPlansData(rawPlans);
      return res.json({ plans: preparedPlans });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch plans data' });
    }
  }

  return res.status(400).json({ message: 'fetch_plans_info is not set to 1' });
};
