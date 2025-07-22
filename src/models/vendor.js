// models/vendor.js
import { DataTypes } from 'sequelize';
import sequelize from '../db/connection.js';

const Vendor = sequelize.define('vendor', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  email_verified: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
  },
  is_temp: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  vendor_mode: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  show_current_plan_data: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'vendors',
  timestamps: false,
});

export default Vendor;
