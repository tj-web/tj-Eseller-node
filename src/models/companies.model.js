import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Companies = sequelize.define(
  "Companies",
  {
    id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    company: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    employee_size: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    industry: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    website: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    domain: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    company_linkedin_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    facebook_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    twitter_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    company_street: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    company_city: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    company_state: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    company_country: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    company_postal_code: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    company_address: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    keywords: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    company_phone: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    seo_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    technologies: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    total_funding: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    latest_funding: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    latest_funding_amount: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    last_raised_at: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    annual_revenue: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    number_of_retail_locations: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    apollo_account_id: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    sic_codes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    short_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    founded_year: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    logo_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    banner: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    specialties: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    organization_id: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    is_deleted: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "tbl_companies",
    timestamps: false,
  }
);

export default Companies;