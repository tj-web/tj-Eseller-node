import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const ProductAlternative = sequelize.define(
  "ProductAlternative",
  {
    product_id: {
      type: DataTypes.INTEGER(11).UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
    alternate_product_id: {
      type: DataTypes.INTEGER(11).UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
    weightage: {
      type: DataTypes.FLOAT(21, 19),
      allowNull: false,
      defaultValue: 0,
    },
    sort_order: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "tbl_product_alternative",
    timestamps: false,
  },
);

export default ProductAlternative;