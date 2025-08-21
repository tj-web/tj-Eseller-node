// import sequelize from "../../db/connection.js";

// export const getLeadsCount = async (vendor_id, filters = {}) => {
//   const {
//     date_from,
//     date_to,
//     srch_value,
//     srch_by,
//     action,
//     status,
//     limit=10,
//     pageNumber=1,
//   } = filters;

//   let whereConditions = `
//     tl.vendor_id = ?
//     AND tl.phone <> ''
//     AND tl.email <> ''
//   `;
//   const replacements = [vendor_id];
//   const offset = (pageNumber - 1) * limit;

//   if (date_from) {
//     whereConditions += ` AND DATE(tl.created_at) >= ?`;
//     replacements.push(date_from);
//   }

//   if (date_to) {
//     whereConditions += ` AND DATE(tl.created_at) <= ?`;
//     replacements.push(date_to);
//   }

//   if (srch_value && srch_by) {
//     if (["email", "phone", "name", "product_name"].includes(srch_by)) {
//       whereConditions += ` AND tl.${srch_by} LIKE ?`;
//       replacements.push(`%${srch_value}%`);
//     }
//   } else if (srch_value) {
//     whereConditions += ` AND (
//       tl.name LIKE ?
//       OR tl.email LIKE ?
//       OR tl.phone LIKE ?
//     )`;
//     const likeSearch = `%${srch_value}%`;
//     replacements.push(likeSearch, likeSearch, likeSearch);
//   }

//   if (action) {
//     whereConditions += ` AND tl.lead_action = ?`;
//     replacements.push(action);
//   }

//   if (status) {
//     whereConditions += ` AND tl.status = ?`;
//     replacements.push(status);
//   }

//   const query = `
//     SELECT
//       tl.*,
//       tls.status_name,
//       IF(tls.subaction_name IS NULL, tls.lead_action_name, tls.subaction_name) AS lead_action_name,
//       tl.created_at AS start_date,
//       tr.call_status,
//       tp.slug, tp.micro_transaction_model_price,
//       (CASE WHEN tp.lead_model_type IN (1, 3, 4, 7) THEN 1 WHEN tl.dial_code != 91 THEN 1 ELSE 0 END) AS show_contact_cta,
//       (CASE WHEN tp.lead_model_type IN (4, 7) THEN 1 ELSE 0 END) AS show_upgrade_cta
//     FROM (
//       SELECT
//         tl.id,
//         tl.email AS customer_email,
//         tl.original_parent_id,
//         tl.parent_id,
//         tl.dial_code,
//         IF(tl.dial_code != 91, '1', '0') AS is_international,
//         tl.city,
//         tl.state,
//         tl.lead_model_type,
//         tl.credit_used,
//         tl.show_credits,
//         tl.vendor_id,
//         tl.is_acd,
//         IF(tl.dial_code != 91, '1', tl.is_show_contact) AS is_show_contact,
//         IF(tl.dial_code != 91, tl.phone, IF(tl.is_show_contact, tl.phone, '')) AS show_contact_phone,
//         tl.is_lead_cta,
//         tl.is_communication,
//         tl.is_contact_viewed,
//         IF(tl.is_contact_viewed > 0, CONCAT(tl.email, ' | ', tl.phone), NULL) AS contact_info,
//         IF(tl.is_contact_viewed > 0, tl.email, NULL) AS lead_email,
//         IF(tl.is_contact_viewed > 0, tl.phone, NULL) AS lead_phone,
//         tl.acd_uuid,
//         tl.name,
//         tl.customer_id,
//         tl.company_id,
//         tl.product_id,
//         IF(tl.parent_id IS NULL, tl.product_name, tl.software_category) AS product_name,
//         tl.brand_id,
//         IF(tl.lead_type = 'DEMO', 'DEMO', 'CALL') AS lead_type,
//         tl.lead_visibility,
//         tl.status,
//         tl.lead_action,
//         tl.created_at,
//         tl.is_trashed,
//         tl.is_duplicate,
//         tl.user_intent
//       FROM tbl_leads AS tl
//       WHERE ${whereConditions}
//       ORDER BY tl.id DESC
//       LIMIT 10 OFFSET 0
//     ) AS tl
//     LEFT JOIN tbl_request_callbacks tr ON tr.acd_uuid = tl.acd_uuid
//     LEFT JOIN tbl_product tp ON tp.product_id = tl.product_id
//     LEFT JOIN tbl_leads_status tls ON tls.id = tl.lead_action
//     ORDER BY tl.id DESC
//   `;

//   const result = await sequelize.query(query, {
//     replacements,
//     type: sequelize.QueryTypes.SELECT,
//   });

//   const leadIds = [
//     ...new Set([
//       ...result
//         .map(lead => lead.original_parent_id)
//         .filter(id => id !== null && id !== undefined && id !== ""), // array_filter equivalent
//       ...result.map(lead => lead.id)
//     ])
//   ];

// let leadQuestions = (await lead_questions(leadIds)) || [];

// function getAdditionalQuestions(questions) {
//   const tempQns = [];

//   if (Array.isArray(questions) && questions.length > 0) {
//     let qId = null;

//     for (const ques of questions) {
//       if (ques.answer && ques.answer.trim() !== "") {
//         if (ques.question_id !== qId) {
//           // Push a copy of ques so we don't mutate original object
//           tempQns.push({ ...ques });
//         } else {
//           // Append answer to the last added question
//           tempQns[tempQns.length - 1].answer += "  |  " + ques.answer;
//         }
//         qId = ques.question_id;
//       }
//     }
//   }

//   return tempQns;
// }

// const updatedResult = await Promise.all(
//   result.map(async (lead) => {
//     let oemNote = (await oem_note(lead.id)) || [];
//     let remark = (await lead_remark(lead.id)) || null;
//     let leadQueId = lead?.original_parent_id ?? lead?.id;

//     let additional_info = [];
//     if(leadQuestions[leadQueId] && leadQuestions[leadQueId] !== ''){
//       additional_info = await getAdditionalQuestions(leadQuestions[leadQueId])
//     }

//     return {
//       ...lead,
//       oem_note: oemNote,
//       remark: remark,
//       additional_info ,
//       limit:+limit,
//       offset, // attach questions for this lead
//     };
//   })
// );

// return updatedResult;

// };

// export const oem_note = async (lead_id) => {
//   const noteQuery = `
//     SELECT id, lead_id, value
//     FROM crm_activity ca
//     WHERE ca.lead_id = ?
//       AND type = 'note_oem'
//     ORDER BY id DESC
//     LIMIT 1
//   `;

//   const noteResult = await sequelize.query(noteQuery, {
//     replacements: [lead_id],
//     type: sequelize.QueryTypes.SELECT,
//   });

//   return noteResult;
// };

// export const lead_remark = async (lead_id) => {
//   const remarkQuery = `
//     SELECT id AS remark_id, remark
//     FROM tbl_leads_history
//     WHERE type IN ('remark','reminder')
//       AND lead_id = ?
//       AND remark != ''
//     ORDER BY id DESC
//     LIMIT 1
//   `;

//   const remarkResult = await sequelize.query(remarkQuery, {
//     replacements: [lead_id],
//     type: sequelize.QueryTypes.SELECT,
//   });

//   return remarkResult.length > 0 ? remarkResult[0] : null;
// };

// export const lead_questions = async (lead_ids) => {
//   const ids = Array.isArray(lead_ids) ? lead_ids : [lead_ids];
//   console.log(">>>>>",lead_ids);
//   const questionQuery = `
//     SELECT
//       alqa.lead_id,
//       lqs.id AS tag_id,
//       lqs.tag_name,
//       lqs.tag_value,
//       aq.id AS question_id,
//       aq.question,
//       (
//         CASE
//           WHEN alqa.custom_ans IS NOT NULL THEN alqa.custom_ans
//           WHEN aqo.is_user_defined = 0 THEN aqo.option
//           WHEN aqo.is_user_defined = 1 AND aqo.option != 'NA' THEN CONCAT(aqo.option, ' - ', alqa.user_defined_ans)
//           ELSE alqa.user_defined_ans
//         END
//       ) AS answer
//     FROM acd_leads_ques_ans alqa
//     LEFT JOIN acd_questions_options aqo ON alqa.ans_id = aqo.id
//     LEFT JOIN acd_questions aq ON alqa.ques_id = aq.id
//     LEFT JOIN leads_questions_tags lqs ON aq.tag_id = lqs.id
//     WHERE alqa.lead_id IN (${ids.map(() => '?').join(',')})
//     ORDER BY alqa.lead_id DESC, aq.id ASC
//   `;

//   const result = await sequelize.query(questionQuery, {
//     replacements: ids,
//     type: sequelize.QueryTypes.SELECT,
//   });

//   // Group by lead_id just like PHP code
//   const leadQns = {};
//   result.forEach((row) => {
//     if (!leadQns[row.lead_id]) {
//       leadQns[row.lead_id] = [];
//     }
//     leadQns[row.lead_id].push(row);
//   });

//   return leadQns;
// };

import sequelize from "../../db/connection.js";

export const getLeadsCount = async (
  vendor_id,
  filters = {},
  limit = 10,
  pageNumber = 1
) => {
  const { date_from, date_to, srch_value, srch_by, action, status } = filters;
  let offset = (pageNumber - 1) * limit;
  let whereConditions = `
    tl.vendor_id = ?
    AND tl.phone <> ''
    AND tl.email <> ''
  `;
  const replacements = [vendor_id];

  if (date_from) {
    whereConditions += ` AND DATE(tl.created_at) >= ?`;
    replacements.push(date_from);
  }

  if (date_to) {
    whereConditions += ` AND DATE(tl.created_at) <= ?`;
    replacements.push(date_to);
  }

  if (srch_value && srch_by) {
    if (["email", "phone", "name", "product_name"].includes(srch_by)) {
      whereConditions += ` AND tl.${srch_by} LIKE ?`;
      replacements.push(`%${srch_value}%`);
    }
  } else if (srch_value) {
    whereConditions += ` AND (
      tl.name LIKE ?
      OR tl.email LIKE ?
      OR tl.phone LIKE ?
    )`;
    const likeSearch = `%${srch_value}%`;
    replacements.push(likeSearch, likeSearch, likeSearch);
  }

  if (action) {
    whereConditions += ` AND tl.lead_action = ?`;
    replacements.push(action);
  }

  if (status) {
    whereConditions += ` AND tl.status = ?`;
    replacements.push(status);
  }

  const query = `
    SELECT 
      tl.*,
      tls.status_name, 
      IF(tls.subaction_name IS NULL, tls.lead_action_name, tls.subaction_name) AS lead_action_name, 
      tl.created_at AS start_date, 
      tr.call_status, 
      tp.slug, tp.micro_transaction_model_price,
      (CASE WHEN tp.lead_model_type IN (1, 3, 4, 7) THEN 1 WHEN tl.dial_code != 91 THEN 1 ELSE 0 END) AS show_contact_cta, 
      (CASE WHEN tp.lead_model_type IN (4, 7) THEN 1 ELSE 0 END) AS show_upgrade_cta 
    FROM (
      SELECT 
        tl.id, 
        tl.email AS customer_email,
        tl.original_parent_id, 
        tl.parent_id, 
        tl.dial_code, 
        IF(tl.dial_code != 91, '1', '0') AS is_international,
        tl.city, 
        tl.state,
        tl.lead_model_type,
        tl.credit_used,
        tl.show_credits,
        tl.vendor_id,
        tl.is_acd, 
        IF(tl.dial_code != 91, '1', tl.is_show_contact) AS is_show_contact,
        IF(tl.dial_code != 91, tl.phone, IF(tl.is_show_contact, tl.phone, '')) AS show_contact_phone,
        tl.is_lead_cta, 
        tl.is_communication, 
        tl.is_contact_viewed, 
        IF(tl.is_contact_viewed > 0, CONCAT(tl.email, ' | ', tl.phone), NULL) AS contact_info, 
        IF(tl.is_contact_viewed > 0, tl.email, NULL) AS lead_email, 
        IF(tl.is_contact_viewed > 0, tl.phone, NULL) AS lead_phone,
        tl.acd_uuid, 
        tl.name, 
        tl.customer_id, 
        tl.company_id,
        tl.product_id, 
        IF(tl.parent_id IS NULL, tl.product_name, tl.software_category) AS product_name, 
        tl.brand_id, 
        IF(tl.lead_type = 'DEMO', 'DEMO', 'CALL') AS lead_type, 
        tl.lead_visibility, 
        tl.status, 
        tl.lead_action, 
        tl.created_at, 
        tl.is_trashed, 
        tl.is_duplicate, 
        tl.user_intent 
      FROM tbl_leads AS tl 
      WHERE ${whereConditions}
      ORDER BY tl.id DESC
      LIMIT ${limit} OFFSET ${offset}
    ) AS tl
    LEFT JOIN tbl_request_callbacks tr ON tr.acd_uuid = tl.acd_uuid
    LEFT JOIN tbl_product tp ON tp.product_id = tl.product_id
    LEFT JOIN tbl_leads_status tls ON tls.id = tl.lead_action
    ORDER BY tl.id DESC;
  `;

  const result = await sequelize.query(query, {
    replacements,
    type: sequelize.QueryTypes.SELECT,
  });

  const leadIds = [
    ...new Set([
      ...result
        .map((lead) => lead.original_parent_id)
        .filter((id) => id !== null && id !== undefined && id !== ""), // array_filter equivalent
      ...result.map((lead) => lead.id),
    ]),
  ];

  let leadQuestions = (await lead_questions(leadIds)) || [];

  function getAdditionalQuestions(questions) {
    const tempQns = [];

    if (Array.isArray(questions) && questions.length > 0) {
      let qId = null;

      for (const ques of questions) {
        if (ques.answer && ques.answer.trim() !== "") {
          if (ques.question_id !== qId) {
            // Push a copy of ques so we don't mutate original object
            tempQns.push({ ...ques });
          } else {
            // Append answer to the last added question
            tempQns[tempQns.length - 1].answer += "  |  " + ques.answer;
          }
          qId = ques.question_id;
        }
      }
    }

    return tempQns;
  }

  const updatedResult = await Promise.all(
    result.map(async (lead) => {
      let oemNote = (await oem_note(lead.id)) || [];
      let remark = (await lead_remark(lead.id)) || null;
      let leadQueId = lead?.original_parent_id ?? lead?.id;

      let additional_info = [];
      if (leadQuestions[leadQueId] && leadQuestions[leadQueId] !== "") {
        additional_info = await getAdditionalQuestions(
          leadQuestions[leadQueId]
        );
      }

      return {
        ...lead,
        oem_note: oemNote,
        remark: remark,
        additional_info, // attach questions for this lead
      };
    })
  );

  return updatedResult;
};

export const oem_note = async (lead_id) => {
  const noteQuery = `
    SELECT id, lead_id, value
    FROM crm_activity ca
    WHERE ca.lead_id = ?
      AND type = 'note_oem'
    ORDER BY id DESC
    LIMIT 1
  `;

  const noteResult = await sequelize.query(noteQuery, {
    replacements: [lead_id],
    type: sequelize.QueryTypes.SELECT,
  });

  return noteResult;
};

export const lead_remark = async (lead_id) => {
  const remarkQuery = `
    SELECT id AS remark_id, remark
    FROM tbl_leads_history
    WHERE type IN ('remark','reminder')
      AND lead_id = ?
      AND remark != ''
    ORDER BY id DESC
    LIMIT 1
  `;

  const remarkResult = await sequelize.query(remarkQuery, {
    replacements: [lead_id],
    type: sequelize.QueryTypes.SELECT,
  });

  return remarkResult.length > 0 ? remarkResult[0] : null;
};

export const lead_questions = async (lead_ids = []) => {
  const ids = Array.isArray(lead_ids) ? lead_ids : [lead_ids];

  const questionQuery = `
    SELECT 
      alqa.lead_id, 
      lqs.id AS tag_id, 
      lqs.tag_name, 
      lqs.tag_value, 
      aq.id AS question_id, 
      aq.question, 
      (
        CASE 
          WHEN alqa.custom_ans IS NOT NULL THEN alqa.custom_ans
          WHEN aqo.is_user_defined = 0 THEN aqo.option 
          WHEN aqo.is_user_defined = 1 AND aqo.option != 'NA' THEN CONCAT(aqo.option, ' - ', alqa.user_defined_ans) 
          ELSE alqa.user_defined_ans
        END
      ) AS answer
    FROM acd_leads_ques_ans alqa 
    LEFT JOIN acd_questions_options aqo ON alqa.ans_id = aqo.id 
    LEFT JOIN acd_questions aq ON alqa.ques_id = aq.id 
    LEFT JOIN leads_questions_tags lqs ON aq.tag_id = lqs.id
    WHERE alqa.lead_id IN (${ids.length && ids.map(() => "?").join(",")})
    ORDER BY alqa.lead_id DESC, aq.id ASC
  `;

  const result = await sequelize.query(questionQuery, {
    replacements: ids,
    type: sequelize.QueryTypes.SELECT,
  });

  // Group by lead_id just like PHP code
  const leadQns = {};
  result.forEach((row) => {
    if (!leadQns[row.lead_id]) {
      leadQns[row.lead_id] = [];
    }
    leadQns[row.lead_id].push(row);
  });

  return leadQns;
};
