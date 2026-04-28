import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";
 
const LeadStatus = sequelize.define(
  "LeadStatus",
  {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    lead_status_guid: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    status_id: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
    },
    status_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    lead_action_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    subaction_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    source: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 1,
    },
    lead_priority: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
    },
    crm_priority: {
      type: DataTypes.TINYINT(4),
      allowNull: true,
    },
  },
  {
    tableName: "tbl_leads_status",
    timestamps: false,
  }
);
 
export default LeadStatus;