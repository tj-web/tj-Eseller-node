import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const OperatingSystem = sequelize.define("OperatingSystem", {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  os_image: {
    type: DataTypes.STRING(255), 
    allowNull: false,
  },
  os_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  os_class: {
    type: DataTypes.STRING(100),
    allowNull: false,
  }
}, {
  tableName: 'tbl_operating_systems',
  timestamps: false, 

});

export default OperatingSystem;