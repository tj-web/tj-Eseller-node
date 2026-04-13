import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const ProductDescription = sequelize.define("ProductDescription", {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  product_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    // Typically this would have a reference to tbl_product
  },
  brief: {
    type: DataTypes.TEXT('medium'),
    allowNull: false,
  },
  overview: {
    type: DataTypes.TEXT('medium'),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT('medium'),
    allowNull: false,
  },
  internal_description: {
    type: DataTypes.TEXT('medium'),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  }
}, {
  tableName: 'tbl_product_description',
  timestamps: false, 

});

export default ProductDescription;