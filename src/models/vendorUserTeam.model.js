import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const VendorUserTeam = sequelize.define(
  "VendorUserTeam",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "vendor_user_team",
    timestamps: false,
  }
);

export default VendorUserTeam;
