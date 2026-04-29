import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const VendorLeadsTeam = sequelize.define(
  "VendorLeadsTeam",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    onboarding_AM: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    onboarding_status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    onboarding_status_updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    preSales_AM: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    pre_sale_status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    pre_sale_status_updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    adSales_AM: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    adsales_status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    adsales_status_updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    t1onboarding_AM: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    t1onboarding_status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    t1onboarding_status_updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    t1preSales_AM: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    t1pre_sale_status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    t1pre_sale_status_updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    t1adSales_AM: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    t1adsales_status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    t1adsales_status_updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "vendors_leads_team",
    timestamps: false,
  }
);

export default VendorLeadsTeam;
