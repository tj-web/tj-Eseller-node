import { DataTypes } from "sequelize";
import sequelize from "../../db/connection.js";

const VendorReqQuery = sequelize.define(
  "VendorReqQuery",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // as per DB
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    query: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "vendor_req_query",
    timestamps: false, 
  }
);

export default VendorReqQuery;