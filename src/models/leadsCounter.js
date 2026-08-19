import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const LeadsCounter = sequelize.define(
  "LeadsCounter",
  {
    id: {
      type: DataTypes.INTEGER(11),
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    order_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      comment: "oms_pi_details",
    },
    product_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },
    count_total: {
      type: DataTypes.DOUBLE(6, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
  },
  {
    tableName: "tbl_leads_counter",
    timestamps: false,
  }
);

export default LeadsCounter;
