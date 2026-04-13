import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const VendorLog = sequelize.define(
  "VendorLog",
  {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    item_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },
    module: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    action_performed: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    action_by: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },
    table_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    column_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    p_key: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    updated_column_value: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    linked_attribute: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    item_updated_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },
    reject_reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.TINYINT(2),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal(
        "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
      ),
    },
  },
  {
    tableName: "vendor_logs",
    timestamps: false,
  },
);

export default VendorLog;
