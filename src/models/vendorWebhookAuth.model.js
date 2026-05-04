import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const VendorWebhookAuth = sequelize.define(
  "VendorWebhookAuth",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    client_id: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    client_secret: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    headers: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    send_basic_auth: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    default_format: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    format: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    http_action: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    request_url: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    auth: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: "vendor_webhook_auth",
    timestamps: false,
  }
);

export default VendorWebhookAuth;
