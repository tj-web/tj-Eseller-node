import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const ProductCategory = sequelize.define(
  "ProductCategory",
  {
    id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    product_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },

    parent_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: 0,
    },

    category_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },

    sort_order: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },

    sponsored_product_sort_order: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0,
    },

    is_primary: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "tbl_product_category",
    timestamps: false,
  }
);

export default ProductCategory;