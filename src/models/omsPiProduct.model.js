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
      allowNull: false,
    },

    product_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },

    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    category_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: null,
    },

    category_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "oms_pi_products",
    timestamps: false,
  }
);

export default OmsPiProduct;