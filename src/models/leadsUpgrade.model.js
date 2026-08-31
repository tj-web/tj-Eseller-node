import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const LeadsUpgrade = sequelize.define(
  "LeadsUpgrade",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    date_modified: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "tbl_leads_upgrade",
    timestamps: false,
  }
);

export default LeadsUpgrade;
