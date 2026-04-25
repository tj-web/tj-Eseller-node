import { Op, QueryTypes } from "sequelize";
import TblLeads from "../../models/leads.model.js";
import TblRequestCallbacks from "../../models/requestCallback.model.js";
import TblProduct from "../../models/product.model.js";
import LeadStatus from "../../models/leadStatus.model.js";
import LeadHistory from "../../models/leadHistory.model.js";
import VendorAuth from "../../models/vendorAuth.model.js";
import EmailQueue from "../../models/emailQueue.model.js";
import sequelize from "../../db/connection.js";

// Define associations
TblLeads.hasOne(TblRequestCallbacks, {
    foreignKey: 'acd_uuid',
    sourceKey: 'acd_uuid',
    as: 'callback'
});

TblLeads.belongsTo(TblProduct, {
    foreignKey: 'product_id',
    as: 'product'
});

TblLeads.belongsTo(LeadStatus, {
    foreignKey: 'lead_action',
    as: 'leadStatus'
});

// Inverse associations for getDemosService
TblRequestCallbacks.belongsTo(TblLeads, {
    foreignKey: 'lead_id',
    as: 'lead'
});

/**
 * Helper to verify lead ownership
 */
const verifyLeadOwnership = async (vendor_id, lead_id) => {
    const lead = await TblLeads.findOne({
        where: { id: lead_id, vendor_id: vendor_id },
        attributes: ['id']
    });
    if (!lead) throw new Error("Unauthorized: Lead does not belong to vendor");
    return lead;
};

/**
 * Helper to mask strings
 */
const maskString = (str, type = 'phone') => {
    if (!str) return "";
    if (type === 'email') {
        const [user, domain] = str.split('@');
        if (!domain) return "****";
        return user.length > 2 
            ? `${user.substring(0, 2)}****@${domain}` 
            : `****@${domain}`;
    }
    return str.length > 4 
        ? "*******" + str.substring(str.length - 3) 
        : "*******";
};

/**
 * Get all leads for a vendor with filtering and pagination.
 */
export const getLeadsService = async (vendor_id, post) => {
    const filters = {
        order_by: post.order_by || 'id',
        order: post.order || 'DESC',
        search: post.search || "",
        date_from: post.date_from || "",
        date_to: post.date_to || "",
        status: post.lead_status !== undefined ? post.lead_status : "",
        srch_by: post.srch_by || '',
        srch_value: post.srch_value || '',
        hour_upto: post.hour_upto || '',
        action: post.lead_action || '',
        is_trashed: post.is_trashed || 0,
        limit: parseInt(post.limit) || 10,
        page: parseInt(post.page) || 0
    };

    const offset = filters.page * filters.limit;

    const whereClause = {
        vendor_id: vendor_id,
        phone: { [Op.ne]: '' },
        email: { [Op.ne]: '' }
    };

    whereClause[Op.or] = [
        { lead_visibility: 1 },
        { [Op.and]: [{ lead_visibility: 0 }, { is_trashed: 1 }] }
    ];

    if (filters.status === 'action_required' || filters.status == -2) {
        filters.status = [0];
        filters.hour_upto = '48';
        filters.action = [1, 2, 4];
        filters.date_to = new Date().toISOString().split('T')[0];
    }

    if (filters.status === '-3') {
        filters.status = "";
        whereClause.is_trashed = 1;
    }

    if (filters.status !== "" && filters.status !== undefined) {
        whereClause.status = filters.status;
    }

    if (filters.action !== "" && filters.action !== undefined) {
        whereClause.lead_action = filters.action;
    }

    if (filters.date_from) {
        whereClause.created_at = { [Op.gte]: new Date(filters.date_from) };
    }

    if (filters.date_to) {
        const toDate = new Date(filters.date_to);
        if (filters.date_to === new Date().toISOString().split('T')[0] && filters.hour_upto === '48') {
            const hourUpto = new Date(Date.now() - 48 * 60 * 60 * 1000);
            whereClause.created_at = { ...whereClause.created_at, [Op.lte]: hourUpto };
        } else {
            toDate.setHours(23, 59, 59, 999);
            whereClause.created_at = { ...whereClause.created_at, [Op.lte]: toDate };
        }
    }

    // PHP Search Logic Refined
    if (filters.srch_by && filters.srch_value) {
        if (filters.srch_by === 'phone' || filters.srch_by === 'email') {
            whereClause.is_contact_viewed = { [Op.gt]: 0 };
        }
        whereClause[filters.srch_by] = { [Op.like]: `%${filters.srch_value}%` };
    }

    if (filters.is_trashed) {
        whereClause.is_trashed = filters.is_trashed;
    }

    const { count, rows } = await TblLeads.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: TblRequestCallbacks,
                as: 'callback',
                attributes: ['call_status', 'recording_url', 'duration', 'requirement', 'start_date', 'company_industry', 'company_size', 'designation'],
                required: false
            },
            {
                model: TblProduct,
                as: 'product',
                attributes: ['slug', 'micro_transaction_model_price', 'lead_model_type'],
                required: false
            },
            {
                model: LeadStatus,
                as: 'leadStatus',
                attributes: ['status_name', 'lead_action_name', 'subaction_name'],
                required: false
            }
        ],
        order: [[filters.order_by, filters.order]],
        limit: filters.limit,
        offset: offset
    });

    const enrichedLeads = await Promise.all(rows.map(async (lead) => {
        const leadJson = lead.toJSON();
        
        // PHP Masking Logic Refined
        const isInternational = leadJson.dial_code !== '91';
        const contactViewed = leadJson.is_contact_viewed > 0;
        const showContact = leadJson.is_show_contact > 0;

        // Email revealed ONLY if is_contact_viewed > 0
        if (!contactViewed) {
            leadJson.email = maskString(leadJson.email, 'email');
        }

        // Phone revealed if International OR is_show_contact OR is_contact_viewed
        if (isInternational || showContact || contactViewed) {
            leadJson.show_contact_phone = leadJson.phone;
        } else {
            leadJson.phone = maskString(leadJson.phone, 'phone');
            leadJson.show_contact_phone = maskString(leadJson.phone, 'phone');
        }

        const latestRemark = await LeadHistory.findOne({
            where: { lead_id: lead.id, type: 'remark' },
            order: [['id', 'DESC']]
        });
        leadJson.remark = latestRemark ? latestRemark.remark : null;
        leadJson.remark_id = latestRemark ? latestRemark.id : null;

        const callAttemptData = await TblRequestCallbacks.findAll({
            attributes: [
                [sequelize.fn('SUM', sequelize.literal("CASE WHEN call_status = 2 THEN 1 ELSE 0 END")), 'connected'],
                [sequelize.fn('SUM', sequelize.literal("CASE WHEN call_status IN (0,1,3,4,5,6) THEN 1 ELSE 0 END")), 'customer_missed']
            ],
            where: { lead_id: lead.id }
        });
        
        const attempts = callAttemptData[0] ? callAttemptData[0].toJSON() : { connected: 0, customer_missed: 0 };
        leadJson.lead_call_attempt_count = parseInt(attempts.connected || 0) + parseInt(attempts.customer_missed || 0);

        const leadModelType = leadJson.product ? leadJson.product.lead_model_type : 2;
        // show_contact_cta visible if International OR Model 1,3,4,7
        leadJson.show_contact_cta = ([1, 3, 4, 7].includes(leadModelType) || isInternational) ? 1 : 0;
        leadJson.show_upgrade_cta = ([4, 7].includes(leadModelType)) ? 1 : 0;

        leadJson.lead_actions = await getLeadActionsService(leadJson);

        return leadJson;
    }));

    return {
        total_rows: count,
        leads: enrichedLeads,
        filters: filters
    };
};

/**
 * Get all demos for a vendor.
 */
export const getDemosService = async (vendor_id, post, flg = '', acd_uuid = '') => {
    const filters = {
        order_by: post.order_by || 'id',
        order: post.order || 'DESC',
        search: post.search || "",
        date_from: post.date_from || "",
        date_to: post.date_to || "",
        status: post.lead_status || "",
        srch_by: post.srch_by || '',
        srch_value: post.srch_value || '',
        limit: parseInt(post.limit) || 10,
        page: parseInt(post.page) || 0
    };

    const offset = filters.page * filters.limit;

    const whereClause = {
        vendor_id: vendor_id
    };

    const callbackWhere = {
        action_performed: 'GetFreeDemo',
        acd_id: { [Op.ne]: '' }
    };

    if (acd_uuid) {
        callbackWhere.acd_uuid = acd_uuid;
    }

    if (flg === 'upcoming') {
        callbackWhere.call_status = 7;
    } else if (flg === 'new') {
        callbackWhere.call_status = { [Op.in]: [0, 5, 6] };
    }

    if (filters.date_from) {
        if (filters.date_to) {
            callbackWhere.start_date = { [Op.between]: [new Date(filters.date_from), new Date(filters.date_to)] };
        } else {
            callbackWhere.start_date = { [Op.gte]: new Date(filters.date_from) };
        }
    }

    const { count, rows } = await TblRequestCallbacks.findAndCountAll({
        where: callbackWhere,
        include: [
            {
                model: TblLeads,
                as: 'lead',
                where: whereClause,
                required: true,
                include: [
                    {
                        model: TblProduct,
                        as: 'product',
                        attributes: ['slug', 'lead_model_type'],
                        required: false
                    },
                    {
                        model: LeadStatus,
                        as: 'leadStatus',
                        attributes: ['status_name', 'lead_action_name', 'subaction_name'],
                        required: false
                    }
                ]
            }
        ],
        order: [[filters.order_by, filters.order]],
        limit: filters.limit,
        offset: offset
    });

    const enrichedDemos = await Promise.all(rows.map(async (demo) => {
        const demoJson = demo.toJSON();
        const lead = demoJson.lead;
        
        // PHP Masking Logic Refined for demos
        const isInternational = lead.dial_code !== '91';
        const contactViewed = lead.is_contact_viewed > 0;
        const showContact = lead.is_show_contact > 0;

        if (!contactViewed) {
            lead.email = maskString(lead.email, 'email');
        }

        if (isInternational || showContact || contactViewed) {
            demoJson.show_contact_phone = lead.phone;
        } else {
            lead.phone = maskString(lead.phone, 'phone');
            demoJson.show_contact_phone = maskString(lead.phone, 'phone');
        }

        const latestRemark = await LeadHistory.findOne({
            where: { lead_id: lead.id, type: 'remark' },
            order: [['id', 'DESC']]
        });
        demoJson.remark = latestRemark ? latestRemark.remark : null;
        demoJson.remark_id = latestRemark ? latestRemark.id : null;

        const leadModelType = lead.product ? lead.product.lead_model_type : 2;
        demoJson.show_contact_cta = ([1, 3, 4, 7].includes(leadModelType) || isInternational) ? 1 : 0;
        demoJson.show_upgrade_cta = ([4, 7].includes(leadModelType)) ? 1 : 0;

        return demoJson;
    }));

    return {
        total_rows: count,
        demo_list: enrichedDemos,
        filters: filters
    };
};

/**
 * Get lead history for a specific vendor's lead.
 */
export const getLeadHistoryService = async (vendor_id, leadId) => {
    await verifyLeadOwnership(vendor_id, leadId);

    return await LeadHistory.findAll({
        where: {
            lead_id: leadId,
            [Op.or]: [
                { source: { [Op.ne]: 'crm' } },
                { source: null }
            ]
        },
        order: [['id', 'DESC']]
    });
};

/**
 * Add remark or reminder with ownership verification.
 */
export const addRemarkReminderService = async (data) => {
    const { vendor_id, lead_id, remark, is_reminder_set, reminder_date, reminder_hour, reminder_minute, reminder_type } = data;
    
    await verifyLeadOwnership(vendor_id, lead_id);

    if (is_reminder_set == 1) {
        const scheduledTime = `${reminder_date} ${reminder_hour}:${reminder_minute}:00`;
        
        await LeadHistory.create({
            lead_id,
            acd_uuid: data.acd_uuid || '',
            type: 'reminder',
            additional_info: reminder_type,
            remark: remark || `${reminder_type} Reminder`,
            scheduled_time: scheduledTime,
            source: 'eseller'
        });

        return { status: true, message: 'Hey, your Reminder is set for ' + scheduledTime };
    } else {
        await LeadHistory.create({
            lead_id,
            acd_uuid: data.acd_uuid || '',
            type: 'remark',
            additional_info: reminder_type,
            remark: remark,
            source: 'eseller'
        });

        return { status: true, message: 'Remark added successfully.' };
    }
};

/**
 * Handler for lead status updates with ownership verification.
 */
export const leadStatusHandlerService = async (vendor_id, body) => {
    const { lead_id, action, action_name } = body;

    if (!lead_id) throw new Error('Lead Id is required');
    await verifyLeadOwnership(vendor_id, lead_id);

    const response = await updateLeadStatusManualService(
        {},
        { lead_id, action, action_name },
        'web'
    );

    if (response) {
        return { status: true, msg: 'Status updated successfully.' };
    } else {
        return { status: false, msg: 'Oops error occured try again.' };
    }
};

/**
 * Port of updateLeadStatusManual from PHP.
 */
export const updateLeadStatusManualService = async (externalServices, data, source = 'web') => {
    if (!data.lead_id) return false;

    const previousLead = await TblLeads.findOne({
        attributes: ['is_contact_viewed', 'lead_action', 'status', 'acd_uuid'],
        where: { id: data.lead_id },
    });
    if (!previousLead) return false;
    const previousLeadData = previousLead.toJSON();

    const nextStatus = await LeadStatus.findOne({
        attributes: ['status_id'],
        where: { id: data.action },
    });
    if (!nextStatus) return false;
    const leadStatus = nextStatus.status_id;

    await TblLeads.update(
        {
            lead_action: data.action,
            status: leadStatus,
            crm_status: data.action,
        },
        { where: { id: data.lead_id } }
    );

    await LeadHistory.create({
        lead_id: data.lead_id,
        acd_uuid: previousLeadData.acd_uuid,
        type: 'action',
        remark: data.action_name,
        source: 'eseller'
    });

    return true;
};

/**
 * Get lead details.
 */
export const getLeadDetailsService = async (vendor_id, leadId) => {
    const lead = await TblLeads.findOne({
        where: { 
            id: leadId,
            vendor_id: vendor_id,
            [Op.or]: [
                { lead_visibility: 1 },
                { [Op.and]: [{ lead_visibility: 0 }, { is_trashed: 1 }] }
            ]
        },
        include: [
            {
                model: TblRequestCallbacks,
                as: 'callback',
                required: false
            },
            {
                model: TblProduct,
                as: 'product',
                attributes: ['slug', 'micro_transaction_model_price', 'lead_model_type'],
                required: false
            },
            {
                model: LeadStatus,
                as: 'leadStatus',
                attributes: ['status_name', 'lead_action_name', 'subaction_name'],
                required: false
            }
        ]
    });

    if (!lead) return null;
    const leadJson = lead.toJSON();
    
    // PHP Masking Logic Refined for details
    const isInternational = leadJson.dial_code !== '91';
    const contactViewed = leadJson.is_contact_viewed > 0;
    const showContact = leadJson.is_show_contact > 0;

    if (!contactViewed) {
        leadJson.email = maskString(leadJson.email, 'email');
    }

    if (isInternational || showContact || contactViewed) {
        leadJson.show_contact_phone = leadJson.phone;
    } else {
        leadJson.phone = maskString(leadJson.phone, 'phone');
        leadJson.show_contact_phone = maskString(leadJson.phone, 'phone');
    }

    const leadModelType = leadJson.product ? leadJson.product.lead_model_type : 2;
    leadJson.show_contact_cta = ([1, 3, 4, 7].includes(leadModelType) || isInternational) ? 1 : 0;
    leadJson.show_upgrade_cta = ([4, 7].includes(leadModelType)) ? 1 : 0;
    leadJson.is_international = isInternational ? '1' : '0';
    
    leadJson.history = await getLeadHistoryService(vendor_id, leadId);
    leadJson.lead_actions = await getLeadActionsService(leadJson);
    
    return leadJson;
};

/**
 * Updates follow-up schedule for a lead with ownership verification.
 */
export const setFollowupService = async (vendor_id, data) => {
    const { lead_id, followup_date, followup_hour, followup_minute, action_name, set_follow_up } = data;
    
    const lead = await verifyLeadOwnership(vendor_id, lead_id);

    if (set_follow_up === 'on') {
        const scheduledTime = `${followup_date} ${followup_hour}:${followup_minute}:00`;
        await LeadHistory.create({
            lead_id,
            acd_uuid: data.acd_uuid || lead.acd_uuid || '',
            type: 'reminder',
            remark: action_name || 'Updated Action',
            scheduled_time: scheduledTime,
            source: 'eseller'
        });
        return { status: true, message: 'Hey, your Reminder is set for ' + scheduledTime };
    } else {
        await LeadHistory.create({
            lead_id,
            acd_uuid: data.acd_uuid || lead.acd_uuid || '',
            type: 'action',
            remark: action_name,
            source: 'eseller'
        });
        return { status: true, message: 'Action added successfully.' };
    }
};

/**
 * Retrieves ACD history with ownership verification through acd_uuid.
 */
export const getLeadAcdHistoryService = async (vendor_id, acd_uuid, type) => {
    // Verify that this acd_uuid belongs to a lead owned by this vendor
    const lead = await TblLeads.findOne({
        where: { acd_uuid: acd_uuid, vendor_id: vendor_id },
        attributes: ['id']
    });
    if (!lead) throw new Error("Unauthorized: ACD record does not belong to vendor");

    const sql = `
        SELECT trc.recording_url, trc.call_status, tkas.display_name, trc.last_updated
        FROM tbl_request_callbacks as trc
        INNER JOIN tbl_knowlarity_acd_status as tkas ON tkas.status_id = trc.call_status 
        WHERE (trc.acd_uuid = :acd_uuid OR trc.parent_acd_uuid = :acd_uuid) 
        AND tkas.source = 2 
        AND tkas.type = (CASE WHEN trc.action_performed = 'GetFreeDemo' THEN 2 ELSE 1 END) 
        ORDER BY start_date
    `;
    
    return await sequelize.query(sql, {
        replacements: { acd_uuid },
        type: QueryTypes.SELECT
    });
};

/**
 * Marks demo as accepted by vendor with ownership verification.
 */
export const acceptDemoService = async (vendor_id, data) => {
    const { acd_uuid, lead_id } = data;
    
    // Verify ownership
    await verifyLeadOwnership(vendor_id, lead_id);

    await TblRequestCallbacks.update(
        { call_status: 7, vendor_id: vendor_id },
        { where: { acd_uuid: acd_uuid, lead_id: lead_id } }
    );
    
    await sequelize.query(
        "INSERT INTO tbl_knowlarity_history (acd_uuid, type, source, status_id, event_data) VALUES (?, ?, ?, ?, ?)",
        { replacements: [acd_uuid, 2, '2', 7, 'Accepted by vendor'], type: QueryTypes.INSERT }
    );

    await LeadHistory.create({
        lead_id,
        acd_uuid,
        type: 'lead_action',
        remark: 'Demo Accepted',
        source: 'eseller'
    });

    return { success: true, msg: 'Great! Demo Confirmed Successfully.' };
};

/**
 * Reschedule demo with ownership verification.
 */
export const rescheduleDemoService = async (vendor_id, data) => {
    const { acd_uuid, lead_id, option1, option2, option3 } = data;
    
    await verifyLeadOwnership(vendor_id, lead_id);

    const reschedule_time_options = JSON.stringify([option1, option2, option3]);

    await TblRequestCallbacks.update(
        { call_status: 5, reschedule_time_options },
        { where: { acd_uuid, lead_id } }
    );

    await LeadHistory.create({
        lead_id,
        acd_uuid,
        type: 'lead_action',
        remark: 'Demo Rescheduled',
        source: 'eseller'
    });

    return { success: true, msg: 'Demo Rescheduled Successfully' };
};

/**
 * Schedule callback with ownership verification.
 */
export const scheduleCallbackService = async (vendor_id, data) => {
    const { lead_id, date, hour, minute, action } = data;
    
    const lead = await verifyLeadOwnership(vendor_id, lead_id);

    const scheduledTime = `${date} ${hour}:${minute}:00`;
    
    if (action === 'GetFreeDemo') {
        await TblLeads.update(
            { status: 2, lead_action: 32, lead_shared: 1 },
            { where: { id: lead_id } }
        );
        await LeadHistory.create({
            lead_id,
            acd_uuid: lead.acd_uuid || '',
            type: 'demo',
            remark: 'Demo Scheduled',
            scheduled_time: scheduledTime,
            source: 'eseller'
        });
    } else {
        await LeadHistory.create({
            lead_id,
            acd_uuid: lead.acd_uuid || '',
            type: 'call',
            remark: lead.acd_uuid ? 'Callback Scheduled' : 'Call Scheduled',
            scheduled_time: scheduledTime,
            source: 'eseller'
        });
    }

    return { status: true, message: 'Callback/Demo scheduled successfully for ' + scheduledTime };
};

/**
 * Retrieves vendor phone numbers.
 */
export const getVendorContactsService = async (vendor_id) => {
    return await VendorAuth.findAll({
        attributes: [
            [sequelize.literal("CONCAT(first_name, ' ', last_name)"), 'contact_name'],
            ['phone', 'contact_number'],
            'dial_code',
            ['email', 'contact_email']
        ],
        where: { vendor_id, is_acd: 1 }
    });
};

/**
 * Get lead insights with ownership verification.
 */
export const getLeadInsightsService = async (vendor_id, lead_id) => {
    await verifyLeadOwnership(vendor_id, lead_id);

    const lead = await TblLeads.findByPk(lead_id, { attributes: ['customer_id', 'email', 'company_id', 'category_id'] });
    if (!lead) return null;

    const result = {
        customer_activity_details: {}, 
        customer_company_information: {}, 
        top_five_key_people: [],
        device: 'web'
    };

    return result;
};

/**
 * Saves vendor interest for insights.
 */
export const unlockLeadInsightsService = async (vendor_id, data) => {
    const { company, email, date, time, remark, gp } = data;
    
    const submitted_at = new Date();
    
    await sequelize.query(
        `INSERT INTO vendor_lead_insight_interest 
        (vendor_id, gp, company_name, contact_email, notes, submitted_at, preferred_call_date, preferred_call_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        {
            replacements: [vendor_id, gp, company, email, remark, submitted_at, date, JSON.stringify(time)],
            type: QueryTypes.INSERT
        }
    );

    await EmailQueue.create({
        to: 'Aniruddha_chaturvedi@techjockey.com',
        cc: '',
        subject: `New Interest in Unlock Lead Insights from ${company}`,
        body: `New Interest recorded for ${company}. Notes: ${remark}`,
        type: 'lead_insight_interest',
        app: 'eseller',
        priority: 0,
        created_at: submitted_at,
        updated_at: submitted_at
    });

    return { status: true, message: 'Interest recorded successfully' };
};

/**
 * Unlocks contact with ownership verification.
 */
export const unlockContactService = async (vendor_id, lead_id) => {
    await verifyLeadOwnership(vendor_id, lead_id);

    await TblLeads.update(
        { is_contact_viewed: 1 },
        { where: { id: lead_id } }
    );

    return { status: true, message: 'Contact unlocked successfully' };
};

/**
 * Private helper to add weekdays to a date.
 */
function addWeekdays(date, days) {
    const d = new Date(date);
    let added = 0;
    while (added < days) {
        d.setDate(d.getDate() + 1);
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) added++;
    }
    return d;
}

/**
 * Get lead actions with business logic.
 */
export const getLeadActionsService = async (lead) => {
    const weekdays = 100;

    let logicDate = new Date(lead.created_at || Date.now());
    const dayName = logicDate.toLocaleDateString('en-US', { weekday: 'short' });
    const timeStr = logicDate.toTimeString().slice(0, 8);
    let flag = false;
    let isMon = false;

    switch (dayName) {
        case 'Sat':
        case 'Sun':
            flag = true;
            break;
        case 'Fri':
            if (timeStr > '18:00:00') flag = true;
            break;
        case 'Mon':
            if (timeStr < '10:00:00') { flag = true; isMon = true; }
            break;
        default:
            flag = false;
    }

    if (flag) {
        if (isMon) {
            logicDate.setHours(10, 0, 0, 0);
        } else {
            const dow = logicDate.getDay();
            const daysUntilMon = (8 - dow) % 7 || 7;
            logicDate.setDate(logicDate.getDate() + daysUntilMon);
            logicDate.setHours(10, 0, 0, 0);
        }
    }

    logicDate = addWeekdays(logicDate, weekdays);
    const disabledActions = logicDate < new Date() ? [3, 13, 14, 15, 28, 31] : [];

    const rows = await LeadStatus.findAll({
        attributes: ['id', 'status_name', 'lead_action_name', 'subaction_name'],
        where: {
            status: 1,
            source: { [Op.in]: [1, 2] },
            ...(lead.is_contact_viewed !== 1 && { status_id: lead.status }),
        },
        order: [['lead_priority', 'ASC']],
    });

    const remarks = [31];
    const actionsMap = {};

    for (const row of rows) {
        const r = row.toJSON();
        const isDisabled =
            r.id === lead.lead_action ||
            r.lead_action_name === r.status_name ||
            disabledActions.includes(r.id);

        if (!r.subaction_name) {
            actionsMap[r.lead_action_name] = {
                id: r.id,
                lead_action_name: r.lead_action_name === r.status_name
                    ? r.lead_action_name
                    : ` - ${r.lead_action_name}`,
                isClickable: !isDisabled,
                isSubAction: false,
                isRemarkRequired: remarks.includes(r.id),
                data: [],
            };
        } else {
            if (!actionsMap[r.lead_action_name]) {
                actionsMap[r.lead_action_name] = {
                    lead_action_name: r.lead_action_name,
                    isSubAction: true,
                    isClickable: false,
                    isRemarkRequired: false,
                    data: [],
                };
            }
            actionsMap[r.lead_action_name].data.push({
                id: r.id,
                lead_action_name: r.subaction_name || r.lead_action_name,
                isClickable: !isDisabled,
                isSubAction: false,
                isRemarkRequired: remarks.includes(r.id),
                data: [],
            });
        }
    }
   
    return Object.values(actionsMap);
};
