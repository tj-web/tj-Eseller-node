import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const CompaniesEmployees = sequelize.define(
  "CompaniesEmployees",
  {
    id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    company_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },

    emp_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    emp_email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },

    emp_phone: {
      type: DataTypes.BIGINT(10),
      allowNull: true,
      defaultValue: null,
    },

    linkedin_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },

    twitter_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },

    photo: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    designation: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: null,
    },

    about: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    apollo_people_id: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    mapped_categories: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    modified_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    status: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 1,
    },

    is_deleted: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
      comment: "1=>Deleted",
    },
  },
  {
    tableName: "tbl_companies_employees",
    timestamps: false,
  }
);

export default CompaniesEmployees;