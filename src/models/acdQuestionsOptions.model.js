import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const AcdQuestionsOptions = sequelize.define(
  "AcdQuestionsOptions",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    option: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "NA",
    },

    is_user_defined: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "acd_questions_options",
    timestamps: false,
  }
);

export default AcdQuestionsOptions;