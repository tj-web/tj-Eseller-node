import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const KnowlarityAcdStatus = sequelize.define(
  "KnowlarityAcdStatus",
  {
    id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    status_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },

    display_name: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    type: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
    },

    source: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
    },
  },
  {
    tableName: "tbl_knowlarity_acd_status",
    timestamps: false,
  }
);

export default KnowlarityAcdStatus;
