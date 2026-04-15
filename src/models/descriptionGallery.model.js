import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const DescriptionGallery = sequelize.define("DescriptionGallery", {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  image: {
    type: DataTypes.TEXT('medium'), 
    allowNull: false,
  },
  img_alt: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  title: {
    type: DataTypes.TEXT('medium'), 
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT('medium'), 
    allowNull: false,
  },
  product_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
  },
  created_on: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, 
  },
  status: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    defaultValue: 1,
  },
  is_deleted: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    // Note: Default is NULL in your image, but usually defaults to 0
  },
}, {
  tableName: 'tbl_description_gallery',
  timestamps: false, 
});

export default DescriptionGallery;