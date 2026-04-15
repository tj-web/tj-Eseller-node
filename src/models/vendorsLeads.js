import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const VendorsLeads = sequelize.define(
  "VendorsLeads",
  {
    lead_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING(50),
    },
    last_name: {
      type: DataTypes.STRING(50),
    },
    company: {
      type: DataTypes.STRING(150),
    },
    email: {
      type: DataTypes.STRING(150),
    },
    dial_code: {
      type: DataTypes.STRING(10),
    },
    phone: {
      type: DataTypes.STRING(20),
    },
    created_at: {
      type: DataTypes.DATE,
    },
    created_by: {
      type: DataTypes.INTEGER,
    },
    acc_manager_id: {
      type: DataTypes.INTEGER,
    },
    creation_source: {
      type: DataTypes.TINYINT,
    },
    category: {
      type: DataTypes.INTEGER,
    },
    city: {
      type: DataTypes.INTEGER,
    },
    state: {
      type: DataTypes.INTEGER,
    },
    country: {
      type: DataTypes.INTEGER,
    },
    linkedin: {
      type: DataTypes.STRING(200),
    },
    website: {
      type: DataTypes.STRING(200),
    },
    updated_at: {
      type: DataTypes.DATE,
    },
    is_deleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "vendors_leads",
    timestamps: false,
  }
);

export default VendorsLeads;