import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const AdminUsers = sequelize.define(
  "AdminUsers",
  {
    adminusers_id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    adminusers_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    adminusers_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    adminusers_phone: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    adminusers_type: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
    },

    adminusers_image: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    adminusers_login: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },

    adminusers_password: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },

    adminusers_password_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    show_status: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0,
    },

    home_content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    permissions_level: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },

    session_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    ip_address: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    date_added: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    modify_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    user_position: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 1,
    },

    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    remember_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    is_deleted: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
    },

    is_allowed_access_anywhere: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "tbl_adminusers",
    timestamps: false,
  }
);

export default AdminUsers;
