import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Setting = sequelize.define(
  "Setting",
  {
    id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    var_title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    var_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    setting_value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    date_added: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    date_modified: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "tbl_website_settings", 
    timestamps: false, // Set to true if you want Sequelize to handle date_added/date_modified automatically
  }
);

export default Setting;