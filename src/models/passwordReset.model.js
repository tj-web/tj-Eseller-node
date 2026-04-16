import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const PasswordReset = sequelize.define(
  "PasswordReset",
  {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "password_resets",
    timestamps: false,
  }
);

export default PasswordReset;