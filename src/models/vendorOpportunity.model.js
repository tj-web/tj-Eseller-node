import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const VendorOpportunities = sequelize.define(
  "VendorOpportunities",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    vendor_name: DataTypes.STRING(255),

    opp_status: DataTypes.STRING(255),
    acc_mgr_status: DataTypes.STRING(255),

    plan_type: DataTypes.STRING(255),

    lead_plan_id: DataTypes.INTEGER,

    plan_name: DataTypes.STRING(255),

    account_type: DataTypes.STRING(255),

    deliverables: DataTypes.TEXT,

    max_lead_limit: DataTypes.INTEGER,
    custom_lead_limit: DataTypes.INTEGER,

    inventory_sold: DataTypes.STRING(255),

    brand_id: DataTypes.INTEGER,
    brand_name: DataTypes.STRING(255),

    expected_closure_date: DataTypes.DATEONLY,

    expected_revenue: DataTypes.INTEGER,
    amount_received: DataTypes.INTEGER,

    validity_start_date: DataTypes.DATEONLY,
    validity_end_date: DataTypes.DATEONLY,

    created_by: DataTypes.INTEGER,

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "vendor_opportunities",
    timestamps: false,
  }
);

export default VendorOpportunities;

