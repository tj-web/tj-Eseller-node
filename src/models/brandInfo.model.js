import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const BrandInfo = sequelize.define(
  "BrandInfo",
  {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    tbl_brand_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },
    information: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    founded_on: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    founders: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    company_size: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    other_info: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    website: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    industry: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    capital: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    tableName: "tbl_brand_info",
    timestamps: false,
  },
);

export default BrandInfo;
