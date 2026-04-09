import { DataTypes } from "sequelize";
import sequelize from "../../db/connection.js";

const VendorAgreement = sequelize.define(
  "VendorAgreement",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    vendor_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    version: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },

    first_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },

    last_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },

    company: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    company_address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    place: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    agreement_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    agreement_by: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    is_signed: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: "0 = No, 1 = Yes",
    },

    agreement_doc: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },
  },
  {
    tableName: "vendor_agreement",
    timestamps: false,
  }
);

export default VendorAgreement;