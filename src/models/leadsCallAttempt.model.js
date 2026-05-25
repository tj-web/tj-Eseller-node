import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const LeadsCallAttempt = sequelize.define(
  "LeadsCallAttempt",
  {
    id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    vendor_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: null,
    },

    lead_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: null,
    },

    attempt_time: {
      type: DataTypes.INTEGER(10),
      allowNull: true,
      defaultValue: null,
      comment: "In Minutes",
    },

    lead_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },

    lead_attempt_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "tbl_leads_call_attempt",
    timestamps: false,
  }
);

export default LeadsCallAttempt;