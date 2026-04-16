import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const TblLeads = sequelize.define(
  "TblLeads",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    lead_guid: DataTypes.STRING(36),

    original_parent_id: DataTypes.INTEGER,
    parent_id: DataTypes.INTEGER,

    lead_type: {
      type: DataTypes.ENUM("NONACD", "CALL", "DEMO"),
      defaultValue: "NONACD",
    },

    source: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },

    name: DataTypes.STRING(120),
    email: DataTypes.STRING(120),
    phone: DataTypes.STRING(20),

    dial_code: {
      type: DataTypes.STRING(5),
      defaultValue: "91",
    },

    customer_id: DataTypes.INTEGER,
    company_id: DataTypes.INTEGER,

    acd_uuid: DataTypes.STRING(36),
    referrer: DataTypes.STRING(255),

    product_id: DataTypes.INTEGER,
    product_name: DataTypes.STRING(100),

    category_id: DataTypes.INTEGER,
    software_category: DataTypes.STRING(100),

    keyword: DataTypes.STRING(200),

    brand_id: DataTypes.INTEGER,
    brand_name: DataTypes.STRING(100),

    ip_address: DataTypes.STRING(100),

    vendor_id: DataTypes.INTEGER,
    vendor_name: DataTypes.STRING(250),

    lead_visibility: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },

    user_id: DataTypes.INTEGER,

    is_manual: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    status: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },

    lead_action: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },

    lead_state: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },

    lead_shared: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },

    customer_demo_link: DataTypes.TEXT,
    vendor_demo_link: DataTypes.TEXT,
    payment_link: DataTypes.TEXT,

    oms_pi_id: DataTypes.INTEGER,

    credit_used: {
      type: DataTypes.FLOAT(3, 2),
      defaultValue: 0.0,
    },

    show_credits: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },

    lead_model_type: {
      type: DataTypes.TINYINT,
      defaultValue: 2,
    },

    is_acd: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },

    is_show_contact: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },

    is_lead_cta: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },

    is_communication: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },

    is_contact_viewed: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },

    is_verified: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },

    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    payment_amount: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: false,
    },

    payment_plan: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    lead_owner_id: DataTypes.INTEGER,

    crm_status: {
      type: DataTypes.TINYINT,
      defaultValue: 25,
    },

    feedback_status: DataTypes.TINYINT,

    is_trashed: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },

    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,

    sell_amount: DataTypes.DOUBLE(10, 2),
    sell_margin: DataTypes.DOUBLE(10, 2),

    is_duplicate: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },

    leadinsight: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },

    city: DataTypes.STRING(255),
    state: DataTypes.STRING(255),

    page: DataTypes.STRING(100),
    lead_form_name: DataTypes.STRING(255),
    user_intent: DataTypes.STRING(60),

    leadgen_id: DataTypes.STRING(20),
  },
  {
    tableName: "tbl_leads",
    timestamps: false,
  },
);

export default TblLeads;





 