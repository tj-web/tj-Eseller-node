
import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const VendorAnalytics = sequelize.define(
  "VendorAnalytics",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    total_leads: DataTypes.INTEGER,
    utilised_leads: DataTypes.INTEGER,

    impression: DataTypes.INTEGER,

    impression_logic: DataTypes.STRING(100),

    pageviews: DataTypes.FLOAT,
    total_requests: DataTypes.FLOAT,

    total_attempt_lead: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },

    total_attempt_time: DataTypes.FLOAT,

    logic_date: DataTypes.DATEONLY,

    create_datetime: DataTypes.DATE,
  },
  {
    tableName: "vendor_analytics",
    timestamps: false, 
  }
);

export default VendorAnalytics;
 