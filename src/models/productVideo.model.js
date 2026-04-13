import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const ProductVideo = sequelize.define("ProductVideo", {
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
  video_title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  video_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  video_desc: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  show_on_acd: {
    type: DataTypes.TINYINT(4),
    allowNull: false,
    defaultValue: 0,
  },
  show_in_comm: {
    type: DataTypes.TINYINT(4),
    allowNull: false,
    defaultValue: 0,
  },
  show_as_cover: {
    type: DataTypes.TINYINT(4),
    allowNull: false,
    defaultValue: 0,
  },
  publish_date: {
    type: DataTypes.DATEONLY, // Maps to DATE (without time)
    allowNull: true,
    defaultValue: null,
  },
  is_deleted: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 0,
  },
  // Mapping Sequelize's automatic timestamps to specific column names
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  }
}, {
  tableName: 'tbl_product_videos',
  timestamps: false
});

export default ProductVideo;