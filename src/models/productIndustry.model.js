import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const ProductIndustry = sequelize.define("ProductIndustry", {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  status: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  last_updated: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'tbl_product_industry',
  timestamps: false,
});

export default ProductIndustry;