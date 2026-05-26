import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const OmsPiProduct = sequelize.define(
  "OmsPiProduct",
  {
    id: {
      type: DataTypes.INTEGER(11),
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    pi_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
    product_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    brand_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
    brand_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },
    amount: {
      type: DataTypes.DOUBLE(16, 2),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  },
  {
    tableName: "oms_pi_products",
    timestamps: false,
  }
);

export default OmsPiProduct;
