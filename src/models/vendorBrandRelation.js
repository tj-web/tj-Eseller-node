import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const VendorBrandRelation = sequelize.define(
  "VendorBrandRelation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    tbl_brand_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: "0=Pending, 1=Approved, 2=Declined",
    },

    is_requested: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "vendor_brand_relation",
    timestamps: false, 
  }
);

export default VendorBrandRelation;