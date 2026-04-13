import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const ProductFaq = sequelize.define("ProductFaq", {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  product_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    references: {
      model: 'tbl_product', 
      key: 'product_id',   
    }
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  answer: {
    type: DataTypes.TEXT,
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
  tableName: 'tbl_product_faqs',
  timestamps: false, 
});

export default ProductFaq;