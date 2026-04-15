import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const EmailQueue = sequelize.define(
  "EmailQueue",
  {
    to: DataTypes.TEXT,
    cc: DataTypes.TEXT,
    bcc: DataTypes.TEXT,
    subject: DataTypes.STRING,
    body: DataTypes.TEXT,
    attachment_path: DataTypes.TEXT,

    from_name: DataTypes.STRING,
    from_email: DataTypes.STRING,

    type: DataTypes.STRING,
    app: DataTypes.STRING,

    priority: DataTypes.INTEGER,

    delivered_at: DataTypes.DATE,
    status: DataTypes.INTEGER,
    attempts: DataTypes.INTEGER,
    response: DataTypes.TEXT,

    table_column: DataTypes.STRING,
    column_value: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  },
  {
    tableName: "email_queue",
    timestamps: false
  }
);

export default EmailQueue;