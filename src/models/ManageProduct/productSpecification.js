
import sequelize from "../../db/connection.js";
import { QueryTypes } from "sequelize";
import ProductSpecification from "../productSpecification.model.js";
import Language from "../languages.model.js";

// const defaultCols = {
//   size: "hello",
//   industries: "",
//   business: "",
//   organization_type: "",
//   customer_support: "",
//   integrations: "",
//   ai_features: "",
//   technology: "0",
//   third_party_integration: "",
//   property_type: "",
//   training: "yes",
//   hw_configuration: "",
//   sw_configuration: "",
//   updated_at: "",
// };

// export const saveOrUpdateProductSpecification = async (id, productData) => {
//   const data = { ...defaultCols, ...productData }; 

//   if (id) {
//     // Build dynamic SET clause
//     const setClause = Object.keys(data).map(k => `${k} = :${k}`).join(", ");
//     await sequelize.query(
//       `UPDATE tbl_product_specification SET ${setClause} WHERE id = :id`,
//       { replacements: { ...data, id }, type: QueryTypes.UPDATE }
//     );
//     return { id, ...data, updated: true };
//   }

//   // Build dynamic INSERT
//   const cols = Object.keys(data).join(", ");
//   const vals = Object.keys(data).map(k => `:${k}`).join(", ");
//   const [insertId] = await sequelize.query(
//     `INSERT INTO tbl_product_specification (${cols}) VALUES (${vals})`,
//     { replacements: data, type: QueryTypes.INSERT }
//   );

//   return { id: insertId, ...data, created: true };
// };

//  mappings to convert IDs to Human Readable Names

const ORGANIZATION_TYPES = {
  1: "Small Business", 2: "Startups", 3: "Medium Business", 
  4: "Enterprises", 5: "SMBs", 6: "SMEs", 7: "MSMBs", 8: "MSMEs"
};

const DEPLOYMENTS = {
  1: "Cloud", 2: "Premise"
};

const OPERATING_SYSTEMS = {
  1: "Ubuntu", 2: "Windows", 3: "iOS", 4: "Android", 5: "MacOs", 6: "Windows Phone"
};

const DEVICES = {
  1: "Desktop", 2: "Mobile"
};

export const getProductSpecificationDetails = async (product_id) => {
  try {
    const spec = await ProductSpecification.findOne({
      where: { product_id: product_id }
    });

    if (!spec) return null;

    const data = spec.toJSON();

    // Helper to map comma-separated ID strings to Array of Objects { id, name }
    const mapValues = (csv, dictionary) => {
      if (!csv) return [];
      return csv.split(",").map(id => ({
        id: id.trim(),
        name: dictionary[id.trim()] || "Unknown"
      }));
    };

    // Attach parsed objects to response so frontend can easily render them
    return {
      ...data,
      organization_type_details: mapValues(data.organization_type, ORGANIZATION_TYPES),
      deployment_details: mapValues(data.deployment, DEPLOYMENTS),
      operating_system_details: mapValues(data.operating_system, OPERATING_SYSTEMS),
      device_details: mapValues(data.device, DEVICES)
    };
  } catch (error) {
    console.error("Error fetching product specification:", error);
    throw error;
  }
};



/**
 * Fetches all available languages for the vendor selection list.
 */
export const getLanguageList = async () => {
  try {
    const languages = await Language.findAll({
      attributes: ['id', 'language', 'display_language'],
      order: [['language', 'ASC']] 
    });

    return languages;
  } catch (error) {
    console.error("Error fetching language list:", error);
    throw error;
  }
};

const defaultCols = {
  size: "16-200",
  industries: "",
  business: "",
  customer_support: "",
  integrations: "",
  ai_features: "",
  technology: 0,
  third_party_integration: "",
  property_type: "",
  training: "5",
  compliance_regulation: "",
  hw_configuration: "",
  sw_configuration: "",
  
};

export const saveOrUpdateProductSpecification = async (id, productData) => {
  try {
    // Merge defaults with incoming data
    const dataPayload = { ...productData, ...defaultCols };

    if (id) {
      //  UPDATE
      await ProductSpecification.update(dataPayload, {
        where: { id: id }
      });

      return { id, ...dataPayload, updated: true };
    } else {
      //  INSERT
      const newSpec = await ProductSpecification.create(dataPayload);

      return { 
        id: newSpec.id, 
        ...dataPayload, 
        created: true 
      };
    }
  } catch (error) {
    console.error("Error in saveOrUpdateProductSpecification:", error);
    throw error;
  }
};


