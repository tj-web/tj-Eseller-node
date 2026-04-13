import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const ProductSpecification = sequelize.define("ProductSpecification", {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  product_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    unique: true, 
  },
  size: { type: DataTypes.TEXT, allowNull: false },
  industries: { type: DataTypes.TEXT, allowNull: false },
  business: { type: DataTypes.TEXT, allowNull: false },
  organization_type: { type: DataTypes.TEXT, allowNull: false },
  deployment: { type: DataTypes.STRING(100), allowNull: false },
  operating_system: { type: DataTypes.STRING(100), allowNull: false },
  device: { type: DataTypes.STRING(200), allowNull: false },
  customer_support: { type: DataTypes.STRING(100), allowNull: false },
  integrations: { type: DataTypes.STRING(100), allowNull: false },
  ai_features: { type: DataTypes.STRING(100), allowNull: false },
  technology: { type: DataTypes.TINYINT(4), allowNull: false },
  third_party_integration: { type: DataTypes.TEXT, allowNull: false },
  property_type: { type: DataTypes.TEXT, allowNull: false },
  training: { type: DataTypes.STRING(100), allowNull: false },
  languages: { type: DataTypes.STRING(200), allowNull: false },
  compliance_regulation: { type: DataTypes.TEXT, allowNull: false },
  hw_configuration: { type: DataTypes.TEXT, allowNull: false },
  sw_configuration: { type: DataTypes.TEXT, allowNull: false },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'tbl_product_specification',
  timestamps: false, 
});

export default ProductSpecification;