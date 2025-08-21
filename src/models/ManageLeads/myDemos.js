import sequelize from "../../db/connection.js";

export const getDemosCount = async (vendor_id, search_filter = {}, flg = "", acd_uuid = "",limit= 10,pageNumber= 1) => {

  try {
    if (!vendor_id) {
      return "vendor_id is required";
    }

const limitNum = parseInt(limit, 10) || 10;    
const pageNum  = parseInt(pageNumber, 10) || 1;
const offset = (pageNum - 1) * limitNum;

    
    let acd_uuid_qry = "";
    let call_status_qry = "";
    let date_query = "";
    let search_query = "";
    let status_query = "";
    let action_query = "";
    let visibility_query = "";
    let oms_pi_id_query = "";
    let is_trashed_query = "";


    if (acd_uuid) {
      acd_uuid_qry = `AND trc.acd_uuid = '${acd_uuid}'`;
    } else {

      if (flg === "upcoming") {
        call_status_qry = "AND trc.call_status = 7";
      } else if (flg === "new") {
        call_status_qry = "AND trc.call_status IN (0, 5, 6)";
      }

      
      const { date_from, date_to } = search_filter;
      if (date_from) {
        if (date_to) {
          date_query = `AND DATE(trc.start_date) BETWEEN '${date_from}' AND '${date_to}'`;
        } else {
          date_query = `AND DATE(trc.start_date) = '${date_from}'`;
        }
      }

  


      if (search_filter.srch_by && search_filter.srch_value) {
        const { srch_by, srch_value } = search_filter;
        if (srch_by === "email" || srch_by === "phone") {
          search_query = `AND tl.is_contact_viewed = 1 AND tl.${srch_by} LIKE '%${srch_value}%'`;
        } else {
          search_query = `AND tl.${srch_by} LIKE '%${srch_value}%'`;
        }
      }

  
      if (search_filter.status) {
        status_query = `AND tl.status IN (${search_filter.status})`;
      }


      if (search_filter.action) {
        action_query = `AND tl.lead_action IN (${search_filter.action})`;
      }

      visibility_query = `AND (tl.lead_visibility = 1 OR (tl.lead_visibility = 0 AND tl.is_trashed = 1))`;


      if (search_filter.show_current_plan_data == 1 && search_filter.oms_pi_id) {
        const oms_pi_id = Array.isArray(search_filter.oms_pi_id)
          ? search_filter.oms_pi_id.join(",")
          : search_filter.oms_pi_id;
        oms_pi_id_query = `AND tl.oms_pi_id IN(${oms_pi_id})`;
      }

      // trashed filter
      if (search_filter.is_trashed !== undefined && search_filter.is_trashed !== "") {
        is_trashed_query = `AND tl.is_trashed IN (${search_filter.is_trashed})`;
      }
    }

    //---------- Final Query ----------
    const query = `
      SELECT 
        trc.*, 
        tls.status_name, 
        IF(tls.subaction_name IS NULL, tls.lead_action_name, tls.subaction_name) as lead_action_name, 
        (CASE WHEN tp.lead_model_type IN(1,3,4,7) THEN 1 WHEN tl.dial_code!=91 THEN 1 ELSE 0 END) as show_contact_cta, 
        (CASE WHEN tp.lead_model_type IN(4,7) THEN 1 ELSE 0 END) as show_upgrade_cta, 
        tp.slug, 
        tl.id, 
        tl.original_parent_id, 
        tl.dial_code, 
        IF(tl.dial_code != 91, '1', '0') as is_international, 
        tl.city, 
        tl.state, 
        tl.lead_model_type, 
        tl.credit_used, 
        tl.show_credits, 
        tl.vendor_id, 
        tl.is_acd, 
        IF(tl.dial_code != 91, '1', tl.is_show_contact) as is_show_contact, 
        IF(tl.dial_code != 91, tl.phone, IF(tl.is_show_contact, tl.phone, '')) as show_contact_phone, 
        tl.is_lead_cta, 
        tl.is_communication, 
        tl.is_contact_viewed, 
        IF(tl.is_contact_viewed > 0, CONCAT(tl.email, ' | ', tl.phone), NULL) as contact_info, 
        IF(tl.is_contact_viewed > 0, tl.email, NULL) as lead_email, 
        IF(tl.is_contact_viewed > 0, tl.phone, NULL) as lead_phone, 
        tl.acd_uuid, 
        tl.name, 
        tl.customer_id, 
        tl.product_id, 
        IF(tl.parent_id IS NULL, tl.product_name, tl.software_category) as product_name, 
        tl.brand_id, 
        tl.brand_name, 
        IF(tl.lead_type = 'DEMO', 'DEMO','CALL') as lead_type, 
        tl.lead_visibility, 
        tl.status, 
        tl.lead_action, 
        tl.created_at, 
        tl.is_trashed, 
        tl.is_duplicate, 
        tl.customer_demo_link, 
        tl.vendor_demo_link, 
        tl.id as lead_id, 
        tl.user_intent
      FROM tbl_request_callbacks AS trc 
      INNER JOIN (
        SELECT tl.* 
        FROM tbl_leads as tl 
        WHERE tl.vendor_id = ?
           ${visibility_query}
           ${status_query}
           ${action_query}
           ${oms_pi_id_query}
           ${search_query}
           ${is_trashed_query}
      ) as tl 
        ON (trc.lead_id = tl.id AND trc.action_performed = 'GetFreeDemo') 
      LEFT JOIN tbl_product tp ON tp.product_id = tl.product_id 
      LEFT JOIN tbl_leads_status tls ON tls.id = tl.lead_action 
      WHERE trc.acd_id != '' 
        ${acd_uuid_qry}
        ${date_query}
        ${call_status_qry}
      ORDER BY tl.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;


    const results = await sequelize.query(query, {
      replacements: [vendor_id],
      type: sequelize.QueryTypes.SELECT,
    });

    return results;
  } catch (error) {
    console.error("Error in getDemosCount:", error);
    throw error;
  }
};

