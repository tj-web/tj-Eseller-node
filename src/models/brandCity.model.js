import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const BrandCity = sequelize.define(
  "BrandCity",
  {
    city_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    state_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },
    city_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: 0,
    },
    featured: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
    },
    enable_city_pages: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 1,
    },
    is_deleted: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
    },
    date_added: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    date_modified: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    tableName: "tbl_city",
    timestamps: false,
  },
);

export default BrandCity;
