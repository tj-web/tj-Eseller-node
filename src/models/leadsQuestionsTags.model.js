import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const LeadsQuestionsTags = sequelize.define(
  "LeadsQuestionsTags",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    tag_value: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    tag_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    tableName: "leads_questions_tags",
    timestamps: false,
  }
);

export default LeadsQuestionsTags;