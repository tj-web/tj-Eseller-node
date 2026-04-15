import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Plan = sequelize.define(
  "tbl_plan",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    plan_name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    part_code: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    plan_nature: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price_on_request: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    product_type: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    plan_placing: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    tp_commission_type: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    tp_commission: {
      type: DataTypes.FLOAT(8, 2),
      allowNull: false,
    },
    tp_comment: {
      type: DataTypes.TEXT,
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
    offer_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    offer_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    api_available: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    offer_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    offer_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    currency_type: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    modify_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    new_buy_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    grace_period: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "tbl_plan",
    timestamps: false,
  }
);

export default Plan;