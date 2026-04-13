import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const BusinessType = sequelize.define("BusinessType", {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  business_type_name: {
    type: DataTypes.CHAR(30), 
    allowNull: false,
  },
  date_added: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
  }
}, {
  tableName: 'tbl_business_type',
  timestamps: false, 

});

export default BusinessType;