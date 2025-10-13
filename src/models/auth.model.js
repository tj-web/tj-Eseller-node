import sequelize from "../config/connection.js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

export const add_vendor = async ({
  name = "",
  last_name = "",
  email = "",
  hashPassword = "",
  dial_code = "+91",
  phone = "",
  company_name = "My Company",
  linkedin_id = "",
  vendor_type = "0",
  app_dec_comment = "ui",
  show_popup_date = new Date(),
  registration_source = "api",
  sort_order = '0',
  company_address="2/1 aurbindo",
  website="https://google.com",
  state='0',
  city="0",
  pincode="110064",
  company_logo="",
  cont_prsn_name="",
  cont_prsn_email="",
  bank_name="",
 	branch_name="",
 	acc_holder_name="", 
	acc_number	="",
	ifsc_code  ="",
  	is_contact_person="0",	
	head_office_address="",
 	legal_entry_name="",
  cont_prsn_phone="0",
  gst_number="",
  hsn_number="",
  company_type="",
  pan_number="",
  gstin=""
})  => {
  const t = await sequelize.transaction(); 
  try {
    const hash_string = uuidv4(); 
    const created_at = new Date();
    // 1. Insert into vendors
    const [vendorResult] = await sequelize.query(
      `INSERT INTO vendors 
(first_name, last_name, email, dial_code, phone, password, created_at, last_updated, hash_string, signup_progress, email_verified, status, admin_verified, is_temp, creation_source,vendor_type,app_dec_comment,show_popup_date,registration_source) 
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 2, 0, 1, 1, 1, 1, ?,?,?,?)
`,
      {
        replacements: [
          name,
          last_name,
          email ?? "",
          dial_code ?? "91",
          phone ?? "",
          hashPassword,
          created_at,
          created_at,
          hash_string,
          vendor_type ?? "0",
          app_dec_comment ?? "ui",
          show_popup_date ?? "10-23-1223",
          registration_source ?? ""
        ],
      }
    );

    // vendor_id from insert
    const vendor_id = vendorResult;

    // 2. Insert into vendor_auth
    const [vendorAuthResult] = await sequelize.query(
      `INSERT INTO vendor_auth 
       (vendor_id,first_name, last_name, email, dial_code, phone, password, created_at, hash_string, email_verified, status, is_admin, linkedin_id,sort_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, 1, ?,?)`,
      {
        replacements: [
          vendor_id,
          name,
          last_name,
          email ?? "",
          dial_code ?? "91",
          phone ?? "",
          hashPassword,
          created_at,
          hash_string,
          linkedin_id ?? "",
          sort_order ?? ""
        ],
        transaction: t,
      }
    );

    const vendor_auth_id = vendorAuthResult;

    // 3. Insert into vendor_details
    await sequelize.query(
      `INSERT INTO vendor_details (vendor_id, country, company,company_address,website,state,city,pincode,company_logo,cont_prsn_name,cont_prsn_email,bank_name,
 	branch_name,
 	acc_holder_name, 
	acc_number	,
	ifsc_code  ,
  	is_contact_person,	
	head_office_address,
 	legal_entry_name,cont_prsn_phone,gst_number,hsn_number,company_type,pan_number,gstin) VALUES (?, ?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        replacements: [vendor_id, 99, company_name ?? "",company_address ?? "2/1 aurbindo",website ?? "",state ?? "",city,pincode,company_logo,cont_prsn_name,cont_prsn_email,bank_name,
 	branch_name,
 	acc_holder_name ,
	acc_number	,
	ifsc_code  ,
  	is_contact_person	,
	head_office_address,
 	legal_entry_name,cont_prsn_phone,gst_number,hsn_number,company_type,pan_number,gstin],
        transaction: t,
      }
    );

    // 4. Insert into vendors_leads
    await sequelize.query(
      `INSERT INTO vendors_leads 
       (vendor_id,first_name, last_name, email, dial_code, phone, created_at, creation_source, company, onboarding_status, t1onboarding_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          vendor_id,
          name,
          last_name,
          email ?? "",
          dial_code ?? "91",
          phone ?? "",
          created_at,
          "1",
          "NA",
          "23",
          "37",
        ],
        transaction: t,
      }
    );

    // Commit transaction
    await t.commit();

    return {
      vendor_id,
      vendor_auth_id,
    };
  } catch (error) {
    await t.rollback();
    console.error("Error in add_vendor:", error);
    throw error;
  }
};


// Query which will first check that incoming email exist in the db if yes then return false otherwise insert the mail and password in the db 



// 3. Check email & password for login
// export async function verifyVendor(email, password) {
//   const [result] = await sequelize.query(
//     `SELECT CASE 
//         WHEN EXISTS (
//           SELECT 1 
//           FROM vendor_auth 
//           WHERE email = :email 
//           AND password = MD5(:password)
//         ) 
//         THEN TRUE ELSE FALSE 
//       END AS is_valid;`,
//     {
//       replacements: { email, password },
//       type: sequelize.QueryTypes.SELECT,
//     }
//   );

//   return result.is_valid; 
// }

export async function verifyVendor(email, password) {
  const [result] = await sequelize.query(
    `
    SELECT vendor_id, email, email_verified
    FROM vendor_auth
    WHERE email = :email
      AND password = MD5(:password)
    LIMIT 1;
    `,
    {
      replacements: { email, password },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  if (result) {
    // Vendor exists and password matches
    return {
      is_valid: true,
      vendor_id: result.vendor_id,
      email: result.email,
      email_verified: result.email_verified,
    };
  } else {
    // No matching vendor
    return { is_valid: false };
  }
}


export async function verify_email(email) {
  const [result] = await sequelize.query(
    `
      SELECT 1 
      FROM vendor_auth 
      WHERE email = :email 
      LIMIT 1
    `,
    {
      replacements: { email },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  return !!result;
}



// This query will help you to insert the data into the table mail_query
export async function insermail(email) {
  const [result] = await sequelize.query(
    "INSERT INTO email_queue (`to`) VALUES (:email)",
    {
      replacements: { email },
      type: sequelize.QueryTypes.INSERT,
    }
  );
  return result;
}






