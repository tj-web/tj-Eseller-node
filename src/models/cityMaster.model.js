import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const CityMaster = sequelize.define(
  "CityMaster",
  {
    city_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    state_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    countries_id: {
      type: DataTypes.INTEGER,
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
      type: DataTypes.TEXT("long"),
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
    is_deleted: {
      type: DataTypes.TINYINT(1),
      defaultValue: 0,
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
    tableName: "tbl_city_master",
    timestamps: false,
  }
);

export default CityMaster;
