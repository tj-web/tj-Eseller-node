import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const TblPlanSpec = sequelize.define(
  "tbl_plan_spec",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    plan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    spec_name: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    discount_factor: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    discount_value: {
      type: DataTypes.FLOAT(8, 2),
      allowNull: false,
    },
    discount_percent: {
      type: DataTypes.FLOAT(8, 2),
      allowNull: false,
    },
    offer_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    offer_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    transfer_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    tableName: "tbl_plan_spec",
    timestamps: false,
  }
);

export default TblPlanSpec;