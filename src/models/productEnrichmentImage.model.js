import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const ProductEnrichmentImage = sequelize.define("ProductEnrichmentImage", {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  product_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    // Note: The screenshot shows "MUL" (Multiple), implying this is an Indexed/Foreign Key
  },
  type: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
  image: {
    type: DataTypes.TEXT('medium'), // Maps to mediumtext
    allowNull: false,
  },
  img_alt: {
    type: DataTypes.STRING(255),
    allowNull: true, // YES in the Null column
    defaultValue: null,
  },
  image_width: {
    type: DataTypes.STRING(25),
    allowNull: false,
  },
  image_height: {
    type: DataTypes.STRING(25),
    allowNull: false,
  },
  created_on: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Maps to current_timestamp()
  },
  status: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    defaultValue: 1,
  },
}, {
  // Model Options
  tableName: 'tbl_product_enrichment_images',
  timestamps: false, 

});

export default ProductEnrichmentImage;