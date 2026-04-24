import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const StateMaster = sequelize.define(
  "StateMaster",
  {
    state_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    countries_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    state_gst_code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    state_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    featured: {
      type: DataTypes.TINYINT(1),
      defaultValue: 0,
    },
    status: {
      type: DataTypes.TINYINT(1),
      defaultValue: 1,
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    date_modified: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "tbl_state_master",
    timestamps: false,
  }
);

export default StateMaster;
