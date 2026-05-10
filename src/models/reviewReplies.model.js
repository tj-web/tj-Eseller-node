import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const ReviewReplies = sequelize.define(
  "ReviewReplies",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    review_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    reply_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    replied_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    replied_by_profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    source: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    status: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },

    reject_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    is_deleted: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
  },
  {
    tableName: "tbl_review_replies",
    timestamps: false,
  }
);

export default ReviewReplies;
