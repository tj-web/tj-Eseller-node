import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const CountriesMaster = sequelize.define(
  "CountriesMaster",
  {
    countries_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    countries_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    countries_iso_code_2: {
      type: DataTypes.CHAR(2),
      allowNull: false,
    },
    countries_iso_code_3: {
      type: DataTypes.CHAR(3),
      allowNull: false,
    },
    countries_zone_for_dox: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      defaultValue: "D",
    },
    countries_zone_for_jumbo: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      defaultValue: "D",
    },
    emoji: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "tbl_countries_master",
    timestamps: false,
  }
);

export default CountriesMaster;
