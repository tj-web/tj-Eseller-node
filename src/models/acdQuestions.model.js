import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const AcdQuestions = sequelize.define(
  "AcdQuestions",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    related_to: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },

    related_to_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    question: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    question_type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },

    tag_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },

    is_mandatory: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },

    module: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    page: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },

    priority: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 1,
    },

    hubspot_field_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    is_deleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "acd_questions",
    timestamps: false,
  }
);

export default AcdQuestions;