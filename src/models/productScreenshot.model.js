import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const ProductScreenshot = sequelize.define("ProductScreenshot", {
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
  image: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  img_alt: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  sort_order: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
  is_deleted: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 0,
  },
  section_id: {
    type: DataTypes.INTEGER(11),
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'tbl_product_screenshots',
  timestamps: false, 
});

export default ProductScreenshot;