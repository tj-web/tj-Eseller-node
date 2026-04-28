import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const VendorLeadInsightInterest = sequelize.define(
  "VendorLeadInsightInterest",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gp: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    company_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contact_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    submitted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    preferred_call_date: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    preferred_call_time: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "vendor_lead_insight_interest",
    timestamps: false,
  }
);

export default VendorLeadInsightInterest;