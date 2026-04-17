import VendorAnalytics from "../../models/vendorAnalytics.model.js";
import VendorOpportunities from "../../models/vendorOpportunity.model.js";
import TblLeads from "../../models/leads.model.js";
import TblRequestCallbacks from "../../models/requestCallback.model.js";
import { Op, fn, col } from "sequelize";


export const dashboardStats = async ({ vendor_id }) => {
  try {
    if (!vendor_id) {
      throw new Error("vendor_id is required");
    }

    TblLeads.hasMany(TblRequestCallbacks, {
      foreignKey: "lead_id",
      sourceKey: "id",
    });

    TblRequestCallbacks.belongsTo(TblLeads, {
      foreignKey: "lead_id",
      targetKey: "id",
    });

    const [
      demo_count,
      opportunities_count,
      impressions_result,
    ] = await Promise.all([
      
      TblRequestCallbacks.count({
        include: [
          {
            model: TblLeads,
            required: true,
            attributes: [],
            where: {
              vendor_id,
              [Op.or]: [
                { lead_visibility: 1 },
                {
                  lead_visibility: 0,
                  is_trashed: 1,
                },
              ],
            },
          },
        ],
        where: {
          action_performed: "GetFreeDemo",
          acd_id: {
            [Op.ne]: "",
          },
        },
      }),

      VendorOpportunities.count({
        where: { vendor_id },
      }),

      VendorAnalytics.findOne({
        attributes: [
          [fn("COALESCE", fn("SUM", col("impression")), 0), "impressions_count"],
        ],
        where: { vendor_id },
        raw: true,
      }),
    ]);

    return {
      demo_count,
      opportunities_count,
      impressions_count: impressions_result?.impressions_count || 0,
      clicks: 0,
      opp_cta_clicks: 0,
      purchases: 0,
      form_started: 0,
      form_submitted: 0,
    };
  } catch (err) {
    console.error("Error in getVendorDashboardStatsORM:", err);
    throw err;
  }
};