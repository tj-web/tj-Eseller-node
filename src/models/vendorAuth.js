import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const VendorAuth = sequelize.define(
  "VendorAuth",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    vendor_id: {
      type: DataTypes.INTEGER,
    },

    is_admin: {
      type: DataTypes.INTEGER,
    },

    first_name: {
      type: DataTypes.STRING(40),
    },

    last_name: {
      type: DataTypes.STRING(40),
    },

    email: {
      type: DataTypes.STRING(120),
    },

    dial_code: {
      type: DataTypes.STRING(5),
    },

    phone: {
      type: DataTypes.STRING(20),
    },

    password: {
      type: DataTypes.STRING(32),
    },

    created_at: {
      type: DataTypes.DATE,
    },

    last_updated: {
      type: DataTypes.DATE,
    },

    hash_string: {
      type: DataTypes.STRING(200),
    },

    email_verified: {
      type: DataTypes.INTEGER,
    },

    status: {
      type: DataTypes.INTEGER,
    },

    is_deleted: {
      type: DataTypes.INTEGER,
    },

    last_login_date: {
      type: DataTypes.DATE,
    },

    is_acd: {
      type: DataTypes.INTEGER,
    },

    admin_verified: {
      type: DataTypes.INTEGER,
    },

    linkedin_id: {
      type: DataTypes.STRING(255),
    },

    sort_order: {
      type: DataTypes.INTEGER,
    },

    designation: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "vendor_auth",
    timestamps: false,
  },
);

export default VendorAuth;
