import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Category = sequelize.define(
  "Category",
  {
    category_id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    parent_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: 0,
    },

    buyer_guide_writer: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
    },

    category_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    icon_class: {
      type: DataTypes.STRING(50),
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

    icon: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    icon_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    banner_url: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    page_title: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    page_keyword: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },

    page_description: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },

    override_page_title: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: 0,
    },

    page_heading: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    override_page_heading: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: 0,
    },

    sort_order: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: 0,
    },

    featured: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0,
    },

    status: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 1,
    },

    is_deleted: {
      type: DataTypes.TINYINT(4),
      allowNull: false,
      defaultValue: 0,
    },

    show_status: {
      type: DataTypes.TINYINT(1),
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
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 5,
    },

    current_status: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 2,
    },

    google_category_mapping: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    main_parent_id: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: 0,
    },

    lead_model_type: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 1,
    },

    mapped_schema_category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    cano_url: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    robot_tag: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
  },
  {
    tableName: "tbl_category",
    timestamps: false,
  }
);

export default Category;