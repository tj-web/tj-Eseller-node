import { DataTypes } from "sequelize";
import sequelize from "../../db/connection.js";

const Designation = sequelize.define(
  "Designation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    designation: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    icon: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },

    icon_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT("medium"),
      allowNull: true,
    },

    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },

    is_deleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: "0 = No, 1 = Yes",
    },

    date_added: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    date_modified: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "tbl_designation",
    timestamps: false, // DB handles timestamps
  }
);

export default Designation;