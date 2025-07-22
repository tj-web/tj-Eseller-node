import { DataTypes } from 'sequelize';
import sequelize from '../db/connection.js';

const VendorAuth = sequelize.define('vendor_auth', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  vendor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  is_admin: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  first_name: {
    type: DataTypes.CHAR(40),
    allowNull: false,
  },
  last_name: {
    type: DataTypes.CHAR(40),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  dial_code: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: '91',
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  password: {
    type: DataTypes.CHAR(32),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  last_updated: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  hash_string: {
    type: DataTypes.STRING(200),
    allowNull: false,
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
  is_deleted: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  last_login_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_acd: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
  },
  admin_verified: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  linkedin_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  tableName: 'vendor_auth',
  timestamps: false, // Your table does not use Sequelize's `createdAt/updatedAt`
});

export default VendorAuth;
