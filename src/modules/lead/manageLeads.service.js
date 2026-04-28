import { Op, QueryTypes } from "sequelize";
import mongoose from "mongoose";
import TblLeads from "../../models/leads.model.js";
import TblRequestCallbacks from "../../models/requestCallback.model.js";
import TblProduct from "../../models/product.model.js";
import LeadStatus from "../../models/leadStatus.model.js";
import LeadHistory from "../../models/leadHistory.model.js";
import VendorAuth from "../../models/vendorAuth.model.js";
import EmailQueue from "../../models/emailQueue.model.js";
import sequelize from "../../db/connection.js";
import Setting from "../../models/websiteSetting.model.js";
import Vendor from "../../models/vendor.model.js";
import OmsPiDetail from "../../models/omsPiDetail.model.js";
import VendorLeadInsightInterest from "../../models/vendorLeadInsightInterest.model.js";
import { dumpTrackingData } from "./leadTracking.service.js";

/**
 * Helper to get vendor's lead insight permissions and allowed products.
 */
const getVendorInsightPermission = async (vendor_id) => {
    const vendor = await Vendor.findByPk(vendor_id, {
        attributes: ['lead_insight_display']
    });

    if (!vendor || vendor.lead_insight_display != 1) {
        return { allowed: false, productIds: [] };
    }

    // Return allowed: true if the feature is enabled for the vendor.
    // We can also fetch the list of products they HAVE a plan for, but if we want to show it for all, we return all.
    // Matching the user's request to see the button and unlock flow.
    return { 
        allowed: true, 
        isFeatureEnabled: true
    };
};

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

    const insightPermission = await getVendorInsightPermission(vendor_id);

    const enrichedLeads = await Promise.all(rows.map(async (lead) => {
        const leadJson = lead.toJSON();


        const isInternational = leadJson.dial_code !== '91';
        const contactViewed = leadJson.is_contact_viewed > 0;

        const showContact = (isInternational || leadJson.is_show_contact > 0);
        leadJson.is_show_contact = showContact ? 1 : 0;


        if (!contactViewed) {
            leadJson.email = maskString(leadJson.email, 'email');
        }


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

        leadJson.lead_action_name = leadJson.leadStatus ? leadJson.leadStatus.lead_action_name : null;
        leadJson.lead_subaction_name = leadJson.leadStatus ? leadJson.leadStatus.subaction_name : null;
        leadJson.lead_status_name = leadJson.leadStatus ? leadJson.leadStatus.status_name : null;

        leadJson.lead_actions = await getLeadActionsService(leadJson);
        
        // Call button permission logic
        let isCallAllowed = true;
        let callDisableMsg = "";

        if (leadModelType === 9) {
            isCallAllowed = true;
        } else if (leadJson.is_show_contact === 0) {
            isCallAllowed = false;
            callDisableMsg = "Sorry! You do not have permission to view this content. Click on Upgrade Now to get access.";
        }
        
        leadJson.is_call_allowed = isCallAllowed ? 1 : 0;
        leadJson.call_disable_msg = callDisableMsg;

        // Lead Insight permission logic: Show button if feature is enabled for vendor
        leadJson.is_lead_insight_allowed = insightPermission.allowed ? 1 : 0;

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

    const insightPermission = await getVendorInsightPermission(vendor_id);

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

        // Lead Insight permission logic
        demoJson.is_lead_insight_allowed = (insightPermission.allowed && insightPermission.productIds.includes(lead.product_id)) ? 1 : 0;

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
    const showContact = (isInternational || leadJson.is_show_contact > 0);
    leadJson.is_show_contact = showContact ? 1 : 0;

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

    // Lead Insight permission logic
    const insightPermission = await getVendorInsightPermission(vendor_id);
    leadJson.is_lead_insight_allowed = (insightPermission.allowed && insightPermission.productIds.includes(leadJson.product_id)) ? 1 : 0;

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
/**
 * Triggers ACD call via main site API
 */
const triggerACD = async (data) => {
    try {
        const mainsiteUrl = process.env.MAINSITE_URL || 'https://www.techjockey.com/';
        const authKey = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlc2VsbGVyaHViLmNvbSIsImF1ZCI6IkVzZWxsZXIgSHViIiwiaWF0IjoxNjExMTIyNTg2LCJuYmYiOjE2MTExMjI1ODYsImV4cCI6MTY0MjY1ODU4NiwiZGF0YSI6eyJlbWFpbCI6Im1heWFua2R1cmdhcGFsMTdAZ21haWwuY29tIn19.7G4AXMtzvk5QiOUTbyQkWH1nxWSsjcKkTUbcPYWZQjw';
        
        const response = await fetch(`${mainsiteUrl}schedule-acd`, {
            method: 'POST',
            headers: {
                'Authorization': authKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        return result;
    } catch (err) {
        console.error("ACD Trigger Failed:", err);
        return { status: false, message: err.message };
    }
};

/**
 * Schedules a callback or demo.
 */
export const scheduleCallbackService = async (vendor_id, data) => {
    const { lead_id, date, hour, minute, action, agent_number } = data;

    const lead = await TblLeads.findOne({
        where: { id: lead_id, vendor_id: vendor_id }
    });
    if (!lead) throw new Error("Unauthorized: Lead does not belong to vendor");

    let scheduledTime;
    if (date && hour && minute) {
        scheduledTime = `${date} ${hour}:${minute}:00`;
    } else {
        // Default to "Now" in IST (UTC+5:30) like PHP
        const now = new Date();
        // Add 5.5 hours for IST + 1 minute buffer
        now.setMinutes(now.getMinutes() + 331); 
        scheduledTime = now.getFullYear() + '-' + 
                        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(now.getDate()).padStart(2, '0') + ' ' + 
                        String(now.getHours()).padStart(2, '0') + ':' + 
                        String(now.getMinutes()).padStart(2, '0') + ':00';
    }

    const acdRequest = {
        user_id: lead.user_id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        dial_code: lead.dial_code,
        product_id: lead.product_id,
        acd_uuid: lead.acd_uuid || '',
        lead_id: lead.id,
        source: 'eseller',
        campaign: action === 'GetFreeDemo' ? 'EsellerScheduleDemo' : (lead.acd_uuid ? 'EsellerAppCallback' : 'EsellerAppCall'),
        acd_start_date: scheduledTime.split(' ')[0],
        acd_hour: scheduledTime.split(' ')[1].split(':')[0],
        acd_minute: scheduledTime.split(' ')[1].split(':')[1],
        priority: 'agent',
        agent_number: agent_number || ''
    };

    const acdResponse = await triggerACD(acdRequest);

    if (action === 'GetFreeDemo') {
        await TblLeads.update(
            { status: 2, lead_action: 32, lead_shared: 1 },
            { where: { id: lead_id } }
        );
        await LeadHistory.create({
            lead_id,
            acd_uuid: acdResponse?.data?.acd_uuid || lead.acd_uuid || '',
            type: 'demo',
            remark: 'Demo Scheduled',
            scheduled_time: scheduledTime,
            source: 'eseller'
        });
    } else {
        await LeadHistory.create({
            lead_id,
            acd_uuid: acdResponse?.data?.acd_uuid || lead.acd_uuid || '',
            type: 'call',
            remark: lead.acd_uuid ? 'Callback Scheduled' : 'Call Scheduled',
            scheduled_time: scheduledTime,
            source: 'eseller'
        });
    }

    return { 
        status: acdResponse.status, 
        message: acdResponse.status ? (acdResponse.message || 'Callback scheduled successfully') : (acdResponse.message || 'Failed to trigger call'),
        data: acdResponse.data
    };
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
 * Port of fetch_lead_insights_data from PHP.
 * Orchestrates enrichment from Apollo.
 */
export const fetchLeadInsightsDataService = async (lead_id, vendor_id) => {
    const leadData = await TblLeads.findOne({
        attributes: ['id', 'email', 'company_id', 'category_id', 'leadinsight'],
        where: { id: lead_id }
    });

    if (!leadData) return 0;
    const { email, leadinsight, company_id, category_id } = leadData.toJSON();
    const domain = isBusinessEmail(email);

    if (!domain || leadinsight === 1) {
        return 0;
    }

    let organization = null;
    const companyDetail = await sequelize.query(
        "SELECT id, domain, organization_id FROM tbl_companies WHERE domain = ?",
        { replacements: [domain], type: QueryTypes.SELECT, plain: true }
    );

    if (companyDetail) {
        organization = {
            status: 2,
            msg: `domain ${domain} already exists`,
            data: {
                company_id: companyDetail.id,
                organization_id: companyDetail.organization_id,
                domain: companyDetail.domain,
            }
        };
    } else {
        organization = await getOrganizationData(domain);
    }

    if (!organization || organization.status === 0) {
        return 0;
    }

    await TblLeads.update(
        { company_id: organization.data.company_id, leadinsight: 1 },
        { where: { id: lead_id } }
    );

    const employeeList = await getEmployeeList(domain, category_id, lead_id, organization.data);

    if (employeeList.status === 1 && employeeList.data.apollo_people_ids.length > 0) {
        await getEmployeeEmails(employeeList.data.apollo_people_ids);
    }

    return 1;
};

/**
 * Helper to check if email is business email.
 */
const isBusinessEmail = (email) => {
    if (!email) return null;
    const nonBusinessPattern = /@(gmail|hotmail|outlook|yahoo|rediffmail|gmil|gmial|gmal)\./i;
    if (nonBusinessPattern.test(email)) {
        return null;
    }
    const domainPattern = /@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
    const matches = email.match(domainPattern);
    return matches ? matches[1] : null;
};

/**
 * Helper to map employee count to range.
 */
const getCompanySize = (value) => {
    const companySizes = [
        { min: 0, max: 10, range: "0-10" },
        { min: 11, max: 50, range: "11-50" },
        { min: 51, max: 200, range: "51-200" },
        { min: 201, max: 500, range: "201-500" },
        { min: 501, max: 1000, range: "501-1000" },
        { min: 1001, max: 5000, range: "1001-5000" },
        { min: 5001, max: 10000, range: "5001-10000" },
        { min: 10001, max: Number.MAX_SAFE_INTEGER, range: "10000+" }
    ];

    for (const size of companySizes) {
        if (value >= size.min && value <= size.max) {
            return size.range;
        }
    }
    return "Invalid size";
};

/**
 * Fetches organization data from Apollo.
 */
const getOrganizationData = async (domain) => {
    const apiKey = process.env.APOLLO_API_KEY;
    if (!apiKey || apiKey === 'YOUR_APOLLO_API_KEY_HERE') {
        console.warn("Apollo API Key missing or placeholder. Skipping enrichment.");
        return { status: 0, msg: "API Key missing" };
    }

    const url = `https://api.apollo.io/api/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`;

    try {
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "Cache-Control": "no-cache",
                "Content-Type": "application/json",
                "x-api-key": apiKey
            }
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();

        if (data.organization && data.organization.id) {
            const org = data.organization;
            const estimatedNumEmployees = org.estimated_num_employees || 0;
            const companySize = getCompanySize(estimatedNumEmployees);
            const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

            const [company_id] = await sequelize.query(
                `INSERT INTO tbl_companies (
                    organization_id, company, employees_size, industry, website, domain, 
                    company_linkedin_url, facebook_url, twitter_url, \` company_street\`, 
                    company_city, company_state, company_country, company_postal_code, 
                    company_address, logo_url, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                {
                    replacements: [
                        org.id, org.name || '', companySize, org.industry || '', org.website_url || '', domain,
                        org.linkedin_url || '', org.facebook_url || '', org.twitter_url || '', org.street_address || '',
                        org.city || '', org.state || '', org.country || '', org.postal_code || '',
                        org.raw_address || '', org.logo_url || '', createdAt
                    ],
                    type: QueryTypes.INSERT
                }
            );

            return {
                status: 1,
                msg: "success",
                data: {
                    company_id,
                    organization_id: org.id,
                    domain
                }
            };
        }
    } catch (error) {
        console.error("Apollo Organization Enrichment Error:", error);
    }

    return { status: 0, msg: "organization not found", data: { domain } };
};

/**
 * Fetches employee list from Apollo.
 */
const getEmployeeList = async (domain, category_id, lead_id, companyDetails) => {
    const categoryParams = await getKeyData(category_id);
    const department = categoryParams?.search_keys || [];
    let queryString = '';

    if (department.length > 0) {
        queryString = department.map(item => `person_titles[]=${encodeURIComponent(item)}`).join('&') + '&';
    }

    const empData = await employeeData(domain, queryString);
    const apolloPeopleIds = [];

    if (empData && empData.length > 0) {
        const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

        for (const employee of empData) {
            apolloPeopleIds.push(employee.apollo_people_id);

            const existingEmployee = await sequelize.query(
                "SELECT id, emp_email, apollo_people_id, mapped_categories FROM tbl_companies_employees WHERE apollo_people_id = ?",
                { replacements: [employee.apollo_people_id], type: QueryTypes.SELECT, plain: true }
            );

            if (existingEmployee) {
                const existingMapped = existingEmployee.mapped_categories || "";
                const mappedArray = existingMapped.split(',').map(s => s.trim()).filter(Boolean);

                if (!mappedArray.includes(String(category_id))) {
                    mappedArray.push(category_id);
                    const updatedMapped = mappedArray.filter(Boolean).join(',');
                    await sequelize.query(
                        "UPDATE tbl_companies_employees SET mapped_categories = ? WHERE apollo_people_id = ?",
                        { replacements: [updatedMapped, employee.apollo_people_id], type: QueryTypes.UPDATE }
                    );
                }
            } else {
                await sequelize.query(
                    `INSERT INTO tbl_companies_employees (
                        company_id, emp_name, linkedin_id, twitter_id, photo, 
                        designation, apollo_people_id, mapped_categories, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    {
                        replacements: [
                            companyDetails.company_id, employee.emp_name, employee.linkedin_url, employee.twitter_id,
                            employee.photo, employee.designation, employee.apollo_people_id, category_id, createdAt
                        ],
                        type: QueryTypes.INSERT
                    }
                );
            }
        }

        return { status: 1, msg: `${empData.length} Employee Found`, data: { apollo_people_ids: apolloPeopleIds } };
    }

    return { status: 0, msg: "No Employee Found", data: { apollo_people_ids: apolloPeopleIds } };
};

/**
 * Searches for people on Apollo.
 */
const employeeData = async (domain, queryString) => {
    const apiKey = process.env.APOLLO_API_KEY;
    const headers = {
        "Accept": "application/json",
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
        "x-api-key": apiKey
    };

    let resArr = [];
    const urlWithQuery = `https://api.apollo.io/api/v1/mixed_people/search?${queryString}q_organization_domains_list[]=${encodeURIComponent(domain)}`;

    try {
        const response = await fetchWithCurl(urlWithQuery, headers);
        const data = await response.json();
        const people = (data.people || []).slice(0, 5);

        resArr = people.map(emp => ({
            apollo_people_id: emp.id,
            emp_name: emp.name,
            linkedin_url: emp.linkedin_url,
            twitter_id: emp.twitter_url,
            photo: emp.photo_url,
            designation: emp.title
        }));

        if (resArr.length < 5) {
            const remainLen = 5 - resArr.length;
            const urlWithoutQuery = `https://api.apollo.io/api/v1/mixed_people/search?q_organization_domains_list[]=${encodeURIComponent(domain)}`;
            const responseNoQuery = await fetchWithCurl(urlWithoutQuery, headers);
            const dataNoQuery = await responseNoQuery.json();
            const morePeople = (dataNoQuery.people || []).slice(0, remainLen);

            resArr.push(...morePeople.map(emp => ({
                apollo_people_id: emp.id,
                emp_name: emp.name,
                linkedin_url: emp.linkedin_url,
                twitter_id: emp.twitter_url,
                photo: emp.photo_url,
                designation: emp.title
            })));
        }
    } catch (error) {
        console.error("Apollo Employee Search Error:", error);
    }

    return resArr;
};

/**
 * Bulk matches people to get emails.
 */
const getEmployeeEmails = async (apollo_people_ids) => {
    if (!apollo_people_ids || apollo_people_ids.length === 0) return;

    const apiKey = process.env.APOLLO_API_KEY;
    const url = "https://api.apollo.io/api/v1/people/bulk_match?reveal_personal_emails=true&reveal_phone_number=false";
    const headers = {
        "Accept": "application/json",
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
        "x-api-key": apiKey
    };

    const payload = { details: apollo_people_ids.map(id => ({ id })) };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();

        if (data.matches && data.matches.length > 0) {
            for (const empData of data.matches) {
                if (empData.email) {
                    await sequelize.query(
                        "UPDATE tbl_companies_employees SET emp_email = ? WHERE apollo_people_id = ?",
                        { replacements: [empData.email, empData.id], type: QueryTypes.UPDATE }
                    );
                }
            }
        }
    } catch (error) {
        console.error("Apollo Bulk Match Error:", error);
    }
};

/**
 * Fetches key data from website settings.
 */
const getKeyData = async (key) => {
    const setting = await Setting.findOne({ where: { var_name: 'LEAD_INSIGHT_CATEGORY' } });
    if (!setting) return null;

    try {
        const jsonData = JSON.parse(setting.setting_value || '{}');
        return jsonData[key] || null;
    } catch (e) {
        return null;
    }
};

/**
 * Wrapper for fetch to simulate PHP's fetchWithCurl.
 */
const fetchWithCurl = async (url, headers) => {
    const response = await fetch(url, { method: 'POST', headers });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return response;
};

export const getLeadInsightPlanDetailsService = async (vendor_id) => {
    const result = await OmsPiDetail.findOne({
        where: {
            vendor_id: vendor_id,
            plan_type: 'leadinsight'
        },
        order: [['id', 'DESC']]
    });
    return result ? result.toJSON() : null;
};

export const hasRecentSubmissionService = async (vendor_id) => {
    const count = await VendorLeadInsightInterest.count({
        where: {
            vendor_id: vendor_id,
            submitted_at: {
                [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 14))
            }
        }
    });
    return count > 0;
};
const getActivityText = (asset_type, asset_name, activity_name, activity_count) => {
    const countText = activity_count > 1 ? ` **${activity_count} times**` : "";
    const boldAssetName = asset_name ? `**${asset_name}**` : "";

    if (asset_type === 'searched_keyword' && activity_name === 'form_submit') {
        return `Customer searched for ${boldAssetName}${countText}`;
    } else if (asset_type === 'visited_home_page' && activity_name === 'page_view') {
        return `Customer visited **Home Page**${countText}`;
    } else {
        switch (activity_name) {
            case 'lead_created':
                return `Requested Demo for ${boldAssetName}${countText}`;
            case 'page_view':
                return `Frequently revisited the ${boldAssetName} page${countText}`;
            case 'form_submit':
                return `Initiated call request for ${boldAssetName}${countText}`;
            case 'checked_price':
                return `Checked pricing options for ${boldAssetName} ${asset_type}${countText}`;
            case 'add_to_cart':
                return `${asset_type} ${boldAssetName} has been added to the cart${countText}`;
            case 'add_to_wishlist':
                return `${asset_type} ${boldAssetName} has been added to wishlist${countText}`;
            case 'read_reviews':
                return `Read multiple product reviews for ${boldAssetName} ${asset_type}${countText}`;
            default:
                return `Customer expressed interest in ${boldAssetName} ${asset_type}${countText}`;
        }
    }
};

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

/**
 * Get lead insights with ownership verification.
 */
export const getLeadInsightsService = async (vendor_id, lead_id) => {
    const full_access_plan_id = 38;
    const limited_access_plan_id = 39;

    const vendor = await Vendor.findByPk(vendor_id, {
        attributes: ['lead_insight_display']
    });

    if (!vendor || vendor.lead_insight_display != 1) {
        return null;
    }

    const planDetails = await getLeadInsightPlanDetailsService(vendor_id);
    let plan_name = 'No Plan';
    let plan_id = '';

    if (planDetails) {
        const pi_status = planDetails.pi_status;
        const end_date = planDetails.end_date;
        const currentDate = new Date().toISOString().split('T')[0];

        if (pi_status == '3' && new Date(end_date).toISOString().split('T')[0] >= currentDate) {
            plan_id = planDetails.lead_plan_id;
            plan_name = planDetails.plan_name || 'Paid Access';

            if (plan_id == full_access_plan_id) {
                await fetchLeadInsightsDataService(lead_id, vendor_id);
            }
        } else {
            // Expired or inactive plan -> Limited Access
            plan_id = limited_access_plan_id;
            plan_name = planDetails.plan_name || 'Full Free Access (Limited)';
        }
    } else {
        // No plan at all -> still show Limited Access (Blurred) as requested by user
        plan_id = limited_access_plan_id;
        plan_name = 'Free Access (Limited)';
    }

    await verifyLeadOwnership(vendor_id, lead_id);

    const lead = await TblLeads.findByPk(lead_id, { 
        attributes: ['id', 'user_id', 'email', 'company_id', 'category_id', 'product_name'] 
    });
    if (!lead) return null;

    const result = {
        customer_activity_details: { activities: [] },
        customer_company_information: {},
        top_five_key_people: [],
        device: 'web',
        leadinsight_plan_name: plan_name,
        leadinsight_plan_id: plan_id,
        full_access_plan_id,
        limited_access_plan_id,
        has_recent_submission: await hasRecentSubmissionService(vendor_id)
    };

    // 1. Fetch Company Information from MySQL
    if (lead.company_id) {
        let company = await sequelize.query(
            `SELECT id as company_id, company as name, employees_size as size, industry, website, company_linkedin_url, logo_url 
             FROM tbl_companies WHERE id = ?`,
            { replacements: [lead.company_id], type: QueryTypes.SELECT, plain: true }
        );
        
        if (company && plan_id === limited_access_plan_id) {
            // Redact sensitive company info for Limited Access
            company.name = company.name ? company.name.substring(0, 5) + "********" : "********";
            company.website = company.website ? "********" : null;
            company.company_linkedin_url = company.company_linkedin_url ? "********" : null;
            company.logo_url = null; // Do not send logo
            // Industry and Size are generally safe to show to encourage unlocking
        }
        
        result.customer_company_information = company || {};

        // 2. Fetch Top 5 Key People from MySQL
        let keyPeople = await sequelize.query(
            `SELECT * FROM (
                SELECT id, company_id, emp_name, emp_email, linkedin_id, photo, designation, mapped_categories,
                ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY id ASC) AS \`rank\`
                FROM tbl_companies_employees WHERE company_id = ?
                ${lead.category_id ? 'AND FIND_IN_SET(?, mapped_categories) > 0' : ''}
            ) AS Top5KeyEmployee WHERE \`rank\` <= 5`,
            {
                replacements: lead.category_id ? [lead.company_id, lead.category_id] : [lead.company_id],
                type: QueryTypes.SELECT
            }
        );

        if (keyPeople && plan_id === limited_access_plan_id) {
            keyPeople = keyPeople.map(person => ({
                ...person,
                emp_name: person.emp_name ? person.emp_name.substring(0, 3) + "********" : "********",
                emp_email: "********",
                linkedin_id: person.linkedin_id ? "********" : null,
                photo: null // Do not send photo
            }));
        }
        
        result.top_five_key_people = keyPeople || [];
    }

    // 3. Fetch Buyer Activity Timeline from MongoDB
    if (lead.user_id) {
        try {
            const db = mongoose.connection?.db;
            if (!db) {
                console.warn("MongoDB connection not established for Lead Insights");
                return result;
            }
            const tracksCollection = db.collection('tracks');

            // Get related GUUIDs (simplified version of PHP logic)
            const guuids = await tracksCollection.distinct('feeds.guuid', {
                'feeds.customer_id': String(lead.user_id)
            });

            const activityQuery = [
                {
                    $match: {
                        $or: [
                            { 'feeds.guuid': { $in: guuids } },
                            { 'feeds.lead_id': Number(lead_id) },
                            { 'feeds.lead_id': String(lead_id) }
                        ]
                    }
                },
                { $unwind: '$feeds' },
                { $sort: { created_at: -1 } },
                { $limit: 40 },
                {
                    $project: {
                        _id: 0,
                        guuid: '$feeds.guuid',
                        page_url: '$feeds.page_url',
                        feed_action: '$feeds.feed_action',
                        page_info: '$feeds.page_info',
                        formdata: '$feeds.formdata',
                        product_info: '$feeds.product_info',
                        created_at: '$created_at'
                    }
                }
            ];

            const activities = await tracksCollection.aggregate(activityQuery).toArray();

            // Process activities to match PHP final_activity_array format
            const finalActivityMap = {};
            for (const activity of activities) {
                let assetName = '';
                let assetType = '';
                const feedAction = activity.feed_action;

                // Extraction logic matching Lmslib.php
                const productName = activity.page_info?.product_name || activity.product_info?.product_name || activity.formdata?.product_name;
                const categoryName = activity.page_info?.category_name || activity.product_info?.category_name;

                if (productName) {
                    assetName = (plan_id === limited_access_plan_id) ? (productName.substring(0, 5) + "********") : productName;
                    assetType = 'Product';
                } else if (categoryName) {
                    assetName = (plan_id === limited_access_plan_id) ? (categoryName.substring(0, 5) + "********") : categoryName;
                    assetType = 'Category';
                } else if (activity.page_url?.includes('techjockey.com') && feedAction === 'page_view') {
                    assetName = 'visited_home_page';
                    assetType = 'visited_home_page';
                }

                if (assetName && feedAction && assetType) {
                    if (!finalActivityMap[assetType]) finalActivityMap[assetType] = {};
                    if (!finalActivityMap[assetType][assetName]) finalActivityMap[assetType][assetName] = {};
                    if (!finalActivityMap[assetType][assetName][feedAction]) {
                        finalActivityMap[assetType][assetName][feedAction] = { count: 0, created_at: activity.created_at };
                    }
                    finalActivityMap[assetType][assetName][feedAction].count++;
                }
            }
            result.customer_activity_details = finalActivityMap;
        } catch (mongoError) {
            console.error("MongoDB Insight Error:", mongoError);
        }
    }

    return result;
};

/**
 * Unlock lead insights interest with exact PHP parity.
 */
export const unlockLeadInsightsService = async (vendor_id, data) => {
    console.log("Unlocking insights for vendor:", vendor_id, "Data:", data);
    const { company, email, date = null, time = [], remark = null, gp = null } = data;
    
    const submitted_at = new Date();
    const createdAtStr = submitted_at.toISOString().slice(0, 19).replace('T', ' ');

    try {
        // 1. Save Interest
        const truncatedGp = gp ? gp.substring(0, 10) : null;
        await VendorLeadInsightInterest.create({
            vendor_id,
            gp: truncatedGp,
            company_name: company || 'N/A',
            contact_email: email || 'N/A',
            notes: remark,
            submitted_at,
            preferred_call_date: date,
            preferred_call_time: time ? (typeof time === 'string' ? time : JSON.stringify(time)) : '[]'
        });
        console.log("Interest saved successfully");

        // 2. Queue Email (Matching PHP template)
        const timeArr = Array.isArray(time) ? time : JSON.parse(time || '[]');
        const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Lead Insight Interest Notification</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f6f8fa; padding: 20px; }
    .container { max-width: 600px; margin: auto; background-color: #ffffff; border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px; }
    h2 { color: #2c3e50; }
    .info { margin-top: 20px; padding: 10px; background-color: #f0f4f8; border-left: 4px solid #2c7be5; }
    .info p { margin: 5px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #7f8c8d; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h2>New Interest in "Unlock Lead Insights"</h2>
    <p>A vendor has shown interest in unlocking lead insights. Please review their details below and connect accordingly.</p>
    <div class="info">
      <p><strong>Vendor Id:</strong> ${vendor_id}</p>
      <p><strong>Company:</strong> ${company || 'N/A'}</p>
      <p><strong>Email :</strong> ${email || 'N/A'}</p>
      <p><strong>Preferred Call Time:</strong> ${date || ''} ${timeArr[0] || ''}:${timeArr[1] || ''}</p>
      <p><strong>Additional Notes:</strong> ${remark || ''}</p>
    </div>
    <p><strong>Action Required:</strong><br>Reach out to the vendor to schedule a call and walk them through the Lead Insights feature and benefits.</p>
    <div class="footer">Techjockey Internal Notification • Powered by VendorCRM</div>
  </div>
</body>
</html>`;

        await EmailQueue.create({
            to: 'Aniruddha_chaturvedi@techjockey.com',
            subject: `New Interest in Unlock Lead Insights from ${company}`,
            body: emailBody,
            type: 'lead_insight_interest',
            app: 'eseller',
            priority: 0,
            created_at: createdAtStr,
            updated_at: createdAtStr
        });
        console.log("Email queued successfully");

        return { status: true, message: 'Thank you for your interest! Our team will contact you shortly.' };
    } catch (err) {
        console.error("FAILED to unlock lead insights:", err);
        throw err;
    }
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
            Number(r.id) === Number(lead.lead_action) ||
            r.lead_action_name === r.status_name ||
            disabledActions.includes(Number(r.id));

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
