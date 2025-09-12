import sequelize from "../config/connection.js";
import { QueryTypes } from "sequelize";

export const insertVendorHelpQuery = async (helpData) => {
  try {
    const query = `
      INSERT INTO vendor_req_query (vendor_id, name, email, query, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
      helpData.vendor_id,
      helpData.name,
      helpData.email,
      helpData.query,
      new Date(), // auto timestamp
    ];

    const [result] = await sequelize.query(query, {
      replacements: values,
      type: QueryTypes.INSERT,
    });

    return result; // returns inserted ID
  } catch (error) {
    console.error("Error inserting vendor help query:", error);
    throw error;
  }
};
