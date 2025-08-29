
import sequelize from "../../db/connection.js";
import { QueryTypes } from "sequelize";

const defaultCols = {
  size: "hello",
  industries: "",
  business: "",
  organization_type: "",
  customer_support: "",
  integrations: "",
  ai_features: "",
  technology: "0",
  third_party_integration: "",
  property_type: "",
  training: "yes",
  hw_configuration: "",
  sw_configuration: "",
  updated_at: "",
};

export const saveOrUpdateProductSpecification = async (id, productData) => {
  const data = { ...defaultCols, ...productData }; 

  if (id) {
    // Build dynamic SET clause
    const setClause = Object.keys(data).map(k => `${k} = :${k}`).join(", ");
    await sequelize.query(
      `UPDATE tbl_product_specification SET ${setClause} WHERE id = :id`,
      { replacements: { ...data, id }, type: QueryTypes.UPDATE }
    );
    return { id, ...data, updated: true };
  }

  // Build dynamic INSERT
  const cols = Object.keys(data).join(", ");
  const vals = Object.keys(data).map(k => `:${k}`).join(", ");
  const [insertId] = await sequelize.query(
    `INSERT INTO tbl_product_specification (${cols}) VALUES (${vals})`,
    { replacements: data, type: QueryTypes.INSERT }
  );

  return { id: insertId, ...data, created: true };
};
