import sequelize from "../../db/connection.js";
import { QueryTypes } from "sequelize";


export const saveOrUpdateProductSpecification = async (id, productData) => {
  const { deployment, device, operating_system, organization_type, languages } = productData;

  if (id) {
    // UPDATE query
    const [affectedRows] = await sequelize.query(
      `UPDATE tbl_product_specification 
       SET deployment = :deployment, 
           device = :device, 
           operating_system = :operating_system, 
           organization_type = :organization_type, 
           languages = :languages
       WHERE id = :id`,
      {
        replacements: { id, deployment, device, operating_system, organization_type, languages },
        type: QueryTypes.UPDATE,
      }
    );

    return { id, ...productData, updated: affectedRows > 0 };
  } else {
    // INSERT query
    const [insertId] = await sequelize.query(
      `INSERT INTO tbl_product_specification 
        (deployment, device, operating_system, organization_type, languages) 
       VALUES (:deployment, :device, :operating_system, :organization_type, :languages)`,
      {
        replacements: { deployment, device, operating_system, organization_type, languages },
        type: QueryTypes.INSERT,
      }
    );

    return { id: insertId, ...productData, created: true };
  }
};

