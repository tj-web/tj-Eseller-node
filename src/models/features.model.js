import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Feature = sequelize.define("FeatureLookup", {
  feature_id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  feature_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  feature_icon: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  type: {
    type: DataTypes.TINYINT(4),
    allowNull: false,
  },
  status: {
    type: DataTypes.TINYINT(4),
    allowNull: false,
    defaultValue: 1,
  },
  is_deleted: {
    type: DataTypes.TINYINT(4),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'tbl_feature',
  timestamps: false,
});

export default Feature;