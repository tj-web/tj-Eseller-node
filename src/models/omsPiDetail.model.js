import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const OmsPiDetail = sequelize.define(
  "OmsPiDetail",
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
    plan_type: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    lead_plan_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    pi_status: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    plan_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    tableName: "oms_pi_details",
    timestamps: false,
  }
);

export default OmsPiDetail;
