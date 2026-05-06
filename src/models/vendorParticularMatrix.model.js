import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const VendorParticularMatrix = sequelize.define(
  "VendorParticularMatrix",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    type: {
      type: DataTypes.ENUM("B", "P"),
      allowNull: true,
      defaultValue: null,
    },

    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },

    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },

    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },

    particular_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },

    matrix_status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },

    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "vendor_particular_matrix",
    timestamps: false,
  }
);

export default VendorParticularMatrix;
