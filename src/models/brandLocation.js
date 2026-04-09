import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const BrandLocation = sequelize.define(
  "BrandLocation",
  {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    brand_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },
    location_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    modify_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal(
        "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
      ),
    },
  },
  {
    tableName: "tbl_brand_location",
    timestamps: false,
  },
);

export default BrandLocation;
