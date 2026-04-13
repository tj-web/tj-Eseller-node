import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Language = sequelize.define("Language", {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  language: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  display_language: {
    type: DataTypes.STRING(100),
    allowNull: false,
  }
}, {
  tableName: 'tbl_language',
  timestamps: false, 
});

export default Language;