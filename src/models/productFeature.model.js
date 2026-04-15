import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const ProductFeature = sequelize.define("ProductFeature", {
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
  section_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },
  type: {
    type: DataTypes.TINYINT(4),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT('medium'), 
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  show_on_pdp: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
  feature_display_name: {
    type: DataTypes.STRING(50),
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
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'tbl_product_features',
  timestamps: false, 
});

export default ProductFeature;