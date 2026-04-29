import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const VendorAgentRemarkReminder = sequelize.define(
  "VendorAgentRemarkReminder",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    item_type: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "1->Vendor, 2->Opportunity",
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    agent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "tbl_adminusers",
    },
    value: {
      type: DataTypes.STRING(2000),
      allowNull: true,
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    reminder_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reminder_status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "vendor_agent_remark_reminder",
    timestamps: false,
  }
);

export default VendorAgentRemarkReminder;
