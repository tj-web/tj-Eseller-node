import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const KnowlarityHistory = sequelize.define(
  "KnowlarityHistory",
  {
    id: {
      type: DataTypes.BIGINT(20),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    acd_uuid: {
      type: DataTypes.STRING(36),
      allowNull: true,
      defaultValue: null,
    },

    type: {
      type: DataTypes.TINYINT(4),
      allowNull: true,
      defaultValue: null,
      comment: "1=>call,2=>demo",
    },

    source: {
      type: DataTypes.TINYINT(4),
      allowNull: true,
      defaultValue: null,
      comment: "1=>website, 2=>eseller, 3=>eseller_app",
    },

    status_id: {
      type: DataTypes.TINYINT(4),
      allowNull: true,
      defaultValue: null,
    },

    customer_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    },

    agent_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    },

    agent_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    },

    event_data: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    created_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "tbl_knowlarity_history",
    timestamps: false,
  }
);

export default KnowlarityHistory;