import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Product = sequelize.define(
  "Product",
  {

    product_id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    category_type: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 1
    },
    product_type_id: {
      type: DataTypes.TINYINT(11),
      allowNull: false,
      defaultValue: 1
    },
    product_code: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    product_name: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    merchant_store_name: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    brand_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    similar_product: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    special_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    duration: {
      type: DataTypes.TINYINT(4),
      allowNull: false
    },
    duration_mode: {
      type: DataTypes.CHAR(20),
      allowNull: false
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    price_text: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    qty: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: 1000
    },
    rating_val: {
      type: DataTypes.DECIMAL(10, 1),
      allowNull: false,
      defaultValue: 0.0
    },
    brochure: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    sort_order: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      defaultValue: 0
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    slug_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    search_keyword: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    page_title: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    override_page_title: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0
    },
    meta_title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    page_keyword: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    page_description: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    meta_robots_tags: {
      type: DataTypes.TEXT('medium'),
      allowNull: true
    },
    cano_url: {
      type: DataTypes.STRING(250),
      allowNull: false
    },
    product_label: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    popular: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0
    },
    featured: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0
    },
    featured_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    featured_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    featured_status: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0
    },
    downld_file_path: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    trial_duration: {
      type: DataTypes.TINYINT(4),
      allowNull: false
    },
    trial_duration_in: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    trial_available: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0
    },
    free_downld_path: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    free_downld_available: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0
    },
    price_on_request: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0
    },
    show_in_peripherals: {
      type: DataTypes.TINYINT(1),
      allowNull: true
    },
    price_type: {
      type: DataTypes.TINYINT(1),
      allowNull: false
    },
    commission_type: {
      type: DataTypes.TINYINT(1),
      allowNull: false
    },
    commission: {
      type: DataTypes.FLOAT(10, 2),
      allowNull: false
    },
    tp_comment: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    renewal_terms: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    renewal_terms_comment: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    payment_terms: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    payment_terms_comment: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    discount_factor: {
      type: DataTypes.TINYINT(4),
      allowNull: false
    },
    discount_value: {
      type: DataTypes.FLOAT(8, 2),
      allowNull: false
    },
    offer_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    offer_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    rebate: {
      type: DataTypes.STRING(250),
      allowNull: false
    },
    renewable_term: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    website_url: {
      type: DataTypes.STRING(250),
      allowNull: false
    },
    pricing_document: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    pricing_detail: {
      type: DataTypes.TEXT('medium'),
      allowNull: true
    },
    status: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 1
    },
    is_deleted: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0
    },
    show_status: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0
    },
    product_rank_weightage: {
      type: DataTypes.FLOAT(21, 19),
      allowNull: false,
      defaultValue: 0.0
    },
    custom_search_order: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    custom_order_tag: {
      type: DataTypes.TEXT('medium'),
      allowNull: true
    },
    recommended: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    manual_reviews: {
      type: DataTypes.TINYINT(4),
      allowNull: false
    },
    hsn_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    is_automated: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: false
    },
    date_modified: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    process_status: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 5
    },
    current_status: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 2
    },
    added_by: {
      type: DataTypes.ENUM('admin', 'vendor'),
      allowNull: false,
      defaultValue: 'admin'
    },
    added_by_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    is_bulk_upload: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0
    },
    rank_applied: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0
    },
    shield_image: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    middle_banner: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    desktop_banner_image: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    mobile_banner_image: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tagline: {
      type: DataTypes.TEXT('medium'),
      allowNull: true
    },
    show_brand_info_sec: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 1
    },
    trending_sort_order: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0
    },
    selling_sort_order: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0
    },
    lead_model_type: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 1
    },
    approve_request: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0
    },
    acd_popup_template_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: 0
    },
    lifetime_price: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0
    },
    currency_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: 1
    },
    business_email: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0
    },
    micro_transaction_model_price: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    show_on_offer_page: {
      type: DataTypes.TINYINT(4),
      allowNull: true
    },
    offer_cta_redirection: {
      type: DataTypes.TINYINT(4),
      allowNull: true
    },
    offer_cta_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    buy_now_pdp: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0
    },
    show_compare_alternate: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 1
    }
  }, {
    tableName: 'tbl_product',
    timestamps: false
  });

export default Product;
