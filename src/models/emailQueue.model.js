import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const EmailQueue = sequelize.define(
  "EmailQueue",
  {
    id: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    email_uuid: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    to: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    cc: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bcc: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    body: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    attachment_path: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    from_name: {
      type: DataTypes.STRING(191),
      allowNull: false,
      defaultValue: "Techjockey",
    },
    from_email: {
      type: DataTypes.STRING(191),
      allowNull: false,
      defaultValue: "noreply@techjockey.com",
    },
    reply_to_name: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    reply_to: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    app: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    priority: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0,
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0,
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attempts: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0,
    },
    table_column: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    column_value: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    file_name: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  },
  {
    tableName: "email_queue",
    timestamps: false
  }
);

export default EmailQueue;