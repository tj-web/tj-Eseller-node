import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Brand = sequelize.define(
  "Brand",
  {
    brand_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    brand_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    image: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    image_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    banner: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    banner_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT("medium"),
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    website_url: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    tags: {
      type: DataTypes.TEXT("medium"),
      allowNull: false,
    },

    page_title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    override_page_title: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },

    page_heading: {
      type: DataTypes.TEXT("medium"),
      allowNull: false,
    },

    override_page_heading: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },

    page_keyword: {
      type: DataTypes.TEXT("medium"),
      allowNull: false,
    },

    page_description: {
      type: DataTypes.TEXT("medium"),
      allowNull: false,
    },

    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    featured: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0,
    },

    brand_onboarded: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },

    part_agree_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    vendor_sheet_rec: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },

    oem_onboarded_by: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    tj_agree_by_oem: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },

    oem_agree_by_tj: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },

    agreement_attach: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    target_industry: {
      type: DataTypes.TEXT("medium"),
      allowNull: true,
    },

    lead_locking: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },

    lead_url: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    lead_username: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    lead_password: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    commission_type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: "1=Commission(%),2=Transfer Price",
    },

    commission: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: false,
    },

    commission_comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    renewal_terms: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    renewal_terms_comment: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    payment_terms: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },

    payment_terms_comment: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    remarks: {
      type: DataTypes.TEXT("medium"),
      allowNull: false,
    },

    vendor_sheet: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    onboard_last_updated: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    oem_onboarded_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    onboarding_dec_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    declined_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },

    is_deleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },

    show_status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },

    date_added: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    date_modified: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    process_status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 5,
    },

    current_status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 2,
    },

    added_by: {
      type: DataTypes.ENUM("admin", "vendor"),
      allowNull: false,
      defaultValue: "admin",
    },

    added_by_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    is_internal: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },

    is_acd: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: "tbl_brand",
    timestamps: false,
  }
);

export default Brand;