
import sequelize from "../config/connection.js";

export const isEmailExist = async (email) => {
  const [results] = await sequelize.query(
    `SELECT id, vendor_id, email 
     FROM vendor_auth 
     WHERE email = :email 
     LIMIT 1`,
    {
      replacements: { email },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  return results ? true : false; 
};

// Check if phone exists
export const isPhoneExist = async (dial_code, phone) => {
  const [results] = await sequelize.query(
    `SELECT id, vendor_id, phone 
     FROM vendor_auth 
     WHERE dial_code = :dial_code AND phone = :phone 
     LIMIT 1`,
    {
      replacements: { dial_code, phone },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  return results ? true : false; 
};

