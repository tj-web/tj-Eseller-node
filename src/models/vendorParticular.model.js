import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const VendorParticular = sequelize.define(
  "VendorParticular",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    type: {
      type: DataTypes.ENUM("P", "B"),
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    score: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },

    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
  },
  {
    tableName: "vendor_particulars",
    timestamps: false,
  }
);

export default VendorParticular;
