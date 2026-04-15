import { DataTypes } from "sequelize";
import sequelize from "../../db/connection.js";

const Otp = sequelize.define(
  "Otp",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    phone_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    otp: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },

    created_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    valid_till: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    is_verified: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: "1=Yes, 0=No",
    },

    otp_count: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: "maximum = 5",
    },

    msg: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {    tableName: "tbl_otp", 
    timestamps: false, }
);

export default Otp;
