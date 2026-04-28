import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const LeadHistory = sequelize.define(
  "LeadHistory",
  {
    id: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    lead_id: {
      type: DataTypes.BIGINT(20),
      allowNull: false,
    },
    acd_uuid: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    remark: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    scheduled_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    additional_info: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    recording_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "tbl_leads_history",
    timestamps: false,
  }
);

export default LeadHistory;