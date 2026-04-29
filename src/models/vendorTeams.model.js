import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const VendorTeams = sequelize.define(
  "VendorTeams",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "1=> T1 Enterprise, 2=> SMB",
    },
    team_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "vendor_teams",
    timestamps: false,
  }
);

export default VendorTeams;
