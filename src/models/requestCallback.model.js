import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const TblRequestCallbacks = sequelize.define(
  "TblRequestCallbacks",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    caller_info: {
      type: DataTypes.ENUM("knowlarity", "kaleyra"),
      allowNull: true,
    },

    acd_uuid: {
      type: DataTypes.STRING(36),
      unique: true,
      allowNull: true,
    },

    parent_acd_uuid: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },

    acd_id: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },

    agent_number: DataTypes.STRING(100),
    user_id: DataTypes.STRING(100),

    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },

    contact_number: {
      type: DataTypes.CHAR(20),
      allowNull: false,
    },

    dial_code: {
      type: DataTypes.STRING(5),
      defaultValue: "91",
    },

    priority: {
      type: DataTypes.ENUM("agent", "customer"),
      allowNull: true,
    },

    company_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    product_name: DataTypes.STRING(100),

    brand_id: DataTypes.INTEGER,
    brand_name: DataTypes.STRING(100),

    category_id: DataTypes.INTEGER,
    software_category: DataTypes.STRING(100),

    keyword: DataTypes.STRING(200),

    extension: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    callback_status: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },

    job_title: DataTypes.STRING(120),
    campaign: DataTypes.STRING(120),
    acd_call_reason: DataTypes.STRING(100),

    start_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    end_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    caller_id: DataTypes.STRING(255),

    last_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    vendor_number: DataTypes.STRING(20),

    call_status: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },

    call_uuid: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    recording_url: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    duration: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    response: {
      type: DataTypes.TEXT("medium"),
      allowNull: false,
    },

    source: {
      type: DataTypes.ENUM(
        "website",
        "app",
        "acd_trigger",
        "campaign",
        "eseller",
        "eseller_app",
        "blog",
        "oms",
        "chatbot",
        "manage_panel",
        "techbandhuapp",
        "crm",
      ),
      allowNull: false,
    },

    call_attempts: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },

    ip_address: DataTypes.STRING(250),

    budget: DataTypes.STRING(50),
    timeline: DataTypes.STRING(50),
    requirement: DataTypes.TEXT("medium"),

    company_industry: DataTypes.STRING(100),
    company_size: DataTypes.STRING(100),
    designation: DataTypes.STRING(100),

    reschedule_time_options: DataTypes.STRING(100),
    demo_url: DataTypes.STRING(250),

    retry_count: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },

    vendor_id: DataTypes.BIGINT,

    action_performed: DataTypes.STRING(50),
  },
  {
    tableName: "tbl_request_callbacks",
    timestamps: false,
  },
);

export default TblRequestCallbacks;