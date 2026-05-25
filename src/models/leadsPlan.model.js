import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const LeadsPlan = sequelize.define(
  "LeadsPlan",
  {
    id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    plan_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    plan_type: {
      type: DataTypes.ENUM(
        "credit",
        "branding",
        "seo",
        "banner",
        "MDF"
      ),
      allowNull: false,
      defaultValue: "credit",
    },

    total_lead: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: false,
    },

    duration: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },

    price: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: false,
    },

    discount: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: 0,
    },

    status: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 1,
    },

    gst_rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    hsn: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: null,
    },

    deliverables: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    show_credits: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: "tbl_leads_plan",
    timestamps: false,
  }
);

export default LeadsPlan;