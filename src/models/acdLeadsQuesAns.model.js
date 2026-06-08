import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const AcdLeadsQuesAns = sequelize.define(
  "AcdLeadsQuesAns",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    ques_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    ans_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    ans_by: {
      type: DataTypes.ENUM("CUSTOMER", "AGENT"),
      allowNull: false,
      defaultValue: "CUSTOMER",
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    original_ans_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    user_defined_ans: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    custom_ans: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    date_added: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    date_modified: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "acd_leads_ques_ans",
    timestamps: false,
  }
);

export default AcdLeadsQuesAns;