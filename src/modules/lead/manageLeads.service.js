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
import VendorDetails from "../../models/vendorDetail.model.js";
import StateMaster from "../../models/stateMaster.model.js";
import CityMaster from "../../models/cityMaster.model.js";
import KnowlarityAcdStatus from "../../models/knowlarityAcdStatus.model.js";
import KnowlarityHistory from "../../models/knowlarityHistory.model.js";
import Companies from "../../models/companies.model.js";
import CompaniesEmployees from "../../models/companiesEmployees.model.js";
import LeadsCallAttempt from "../../models/leadsCallAttempt.model.js";
import VendorAnalytics from "../../models/vendorAnalytics.model.js";
import AdminUsers from "../../models/adminUser.model.js";
import VendorBrandRelation from "../../models/vendorBrandRelation.model.js";

import { AppError } from "../../utilis/appError.js";
import StatusCodes from "../../utilis/statusCodes.js";

/**
 * Retrieves vendor lead insight permissions and allowed products.
 */
const getVendorInsightPermission = async (vendor_id) => {
    const vendor = await Vendor.findByPk(vendor_id, {
        attributes: ['lead_insight_display']
    });

    if (!vendor || vendor.lead_insight_display != 1) {
        return { allowed: false, productIds: [] };
    }

    return {
        allowed: true,
        isFeatureEnabled: true
    };
};

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
    if (!lead) throw new AppError("Unauthorized: Lead does not belong to vendor", StatusCodes.FORBIDDEN);
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
export const getLeads = async (vendor_id, post) => {
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
        page: parseInt(post.page) || 0,
        srch_country: post.srch_country || '',
        srch_state: post.srch_state || '',
        srch_city: post.srch_city || ''
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

    if (filters.srch_by && filters.srch_value) {
        if (filters.srch_by === 'phone' || filters.srch_by === 'email') {
            whereClause.is_contact_viewed = { [Op.gt]: 0 };
        }
        whereClause[filters.srch_by] = { [Op.like]: `%${filters.srch_value}%` };
    }

    if (filters.is_trashed) {
        whereClause.is_trashed = filters.is_trashed;
    }

    if (filters.srch_state) {
        whereClause.state = filters.srch_state;
    }

    if (filters.srch_city) {
        whereClause.city = filters.srch_city;
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

    const leadInsightPlan = await OmsPiDetail.findOne({
        where: {
            vendor_id: vendor_id,
            plan_type: 'leadinsight'
        },
        order: [['id', 'DESC']]
    });
    const pi_id = leadInsightPlan ? leadInsightPlan.id : null;

    const enrichedLeads = await Promise.all(rows.map(async (lead) => {
        const leadJson = lead.toJSON();


        const isInternational = leadJson.dial_code !== '91';
        const contactViewed = leadJson.is_contact_viewed > 0;

        const showContact = (isInternational || leadJson.is_show_contact > 0);
        leadJson.is_show_contact = showContact ? 1 : 0;

        if (!contactViewed && !isInternational) {
            leadJson.email = maskString(leadJson.email, 'email');
            leadJson.phone = maskString(leadJson.phone, 'phone');
            leadJson.show_contact_phone = maskString(leadJson.phone, 'phone');
        } else {
            leadJson.show_contact_phone = leadJson.phone;
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
        leadJson.show_contact_cta = ([1, 3, 4, 7].includes(leadModelType) || isInternational) ? 1 : 0;
        leadJson.show_upgrade_cta = ([4, 7].includes(leadModelType)) ? 1 : 0;

        leadJson.lead_action_name = leadJson.leadStatus ? leadJson.leadStatus.lead_action_name : null;
        leadJson.lead_subaction_name = leadJson.leadStatus ? leadJson.leadStatus.subaction_name : null;
        leadJson.lead_status_name = leadJson.leadStatus ? leadJson.leadStatus.status_name : null;

        leadJson.lead_actions = await getLeadActions(leadJson);

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

        let is_lead_insight_allowed = 0;
        if (insightPermission.allowed && pi_id && leadJson.product_id) {
            const resultCount = await sequelize.query(`
                SELECT COUNT(1) as count 
                FROM oms_pi_details opd
                INNER JOIN oms_pi_products opp ON opd.id = opp.pi_id
                WHERE opd.id = :pi_id AND opd.pi_status = 3 AND opp.product_id = :product_id
            `, {
                replacements: { pi_id, product_id: leadJson.product_id },
                type: QueryTypes.SELECT
            });
            is_lead_insight_allowed = resultCount[0].count > 0 ? 1 : 0;
        }
        leadJson.is_lead_insight_allowed = is_lead_insight_allowed;

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
export const getDemos = async (vendor_id, post, flg = '', acd_uuid = '') => {
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

    const leadInsightPlan = await OmsPiDetail.findOne({
        where: {
            vendor_id: vendor_id,
            plan_type: 'leadinsight'
        },
        order: [['id', 'DESC']]
    });
    const pi_id = leadInsightPlan ? leadInsightPlan.id : null;

    const enrichedDemos = await Promise.all(rows.map(async (demo) => {
        const demoJson = demo.toJSON();
        const lead = demoJson.lead;

        const isInternational = lead.dial_code !== '91';
        const contactViewed = lead.is_contact_viewed > 0;
        const showContact = lead.is_show_contact > 0;

        if (!contactViewed && !isInternational) {
            lead.email = maskString(lead.email, 'email');
            lead.phone = maskString(lead.phone, 'phone');
            demoJson.show_contact_phone = maskString(lead.phone, 'phone');
        } else {
            demoJson.show_contact_phone = lead.phone;
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

        let is_lead_insight_allowed = 0;
        if (insightPermission.allowed && pi_id && lead.product_id) {
            const resultCount = await sequelize.query(`
                SELECT COUNT(1) as count 
                FROM oms_pi_details opd
                INNER JOIN oms_pi_products opp ON opd.id = opp.pi_id
                WHERE opd.id = :pi_id AND opd.pi_status = 3 AND opp.product_id = :product_id
            `, {
                replacements: { pi_id, product_id: lead.product_id },
                type: QueryTypes.SELECT
            });
            is_lead_insight_allowed = resultCount[0].count > 0 ? 1 : 0;
        }
        demoJson.is_lead_insight_allowed = is_lead_insight_allowed;

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
export const getLeadHistory = async (vendor_id, leadId) => {
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
export const addRemarkReminder = async (data) => {
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
export const leadStatusHandler = async (vendor_id, body) => {
    const { lead_id, action, action_name } = body;

    if (!lead_id) throw new AppError('Lead Id is required', StatusCodes.BAD_REQUEST);
    await verifyLeadOwnership(vendor_id, lead_id);

    const response = await updateLeadStatusManual(
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
 * Updates lead status manually.
 */
export const updateLeadStatusManual = async (data, source = 'web') => {
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
        remark: data.action_name || data.remark,
        source: 'eseller'
    });

    return true;
};

/**
 * Get lead details.
 */
export const getLeadDetails = async (vendor_id, leadId) => {
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

    leadJson.history = await getLeadHistory(vendor_id, leadId);
    leadJson.lead_actions = await getLeadActions(leadJson);

    const insightPermission = await getVendorInsightPermission(vendor_id);
    let is_lead_insight_allowed = 0;
    if (insightPermission.allowed && leadJson.product_id) {
        const leadInsightPlan = await OmsPiDetail.findOne({
            where: {
                vendor_id: vendor_id,
                plan_type: 'leadinsight'
            },
            order: [['id', 'DESC']]
        });
        const pi_id = leadInsightPlan ? leadInsightPlan.id : null;

        if (pi_id) {
            const resultCount = await sequelize.query(`
                SELECT COUNT(1) as count 
                FROM oms_pi_details opd
                INNER JOIN oms_pi_products opp ON opd.id = opp.pi_id
                WHERE opd.id = :pi_id AND opd.pi_status = 3 AND opp.product_id = :product_id
            `, {
                replacements: { pi_id, product_id: leadJson.product_id },
                type: QueryTypes.SELECT
            });
            is_lead_insight_allowed = resultCount[0].count > 0 ? 1 : 0;
        }
    }
    leadJson.is_lead_insight_allowed = is_lead_insight_allowed;

    return leadJson;
};

/**
 * Updates follow-up schedule for a lead with ownership verification.
 */
export const setFollowup = async (vendor_id, data) => {
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
export const getLeadAcdHistory = async (vendor_id, acd_uuid, type) => {
    const lead = await TblLeads.findOne({
        where: { acd_uuid: acd_uuid, vendor_id: vendor_id },
        attributes: ['id']
    });
    if (!lead) throw new AppError("Unauthorized: ACD record does not belong to vendor", StatusCodes.FORBIDDEN);

    if (!TblRequestCallbacks.associations.acdStatus) {
        TblRequestCallbacks.belongsTo(KnowlarityAcdStatus, { foreignKey: 'call_status', targetKey: 'status_id', as: 'acdStatus' });
    }

    const records = await TblRequestCallbacks.findAll({
        where: {
            [Op.or]: [
                { acd_uuid: acd_uuid },
                { parent_acd_uuid: acd_uuid }
            ]
        },
        include: [{
            model: KnowlarityAcdStatus,
            as: 'acdStatus',
            required: true,
            where: {
                source: 2,
                [Op.and]: sequelize.literal("`acdStatus`.`type` = (CASE WHEN `TblRequestCallbacks`.`action_performed` = 'GetFreeDemo' THEN 2 ELSE 1 END)")
            },
            attributes: ['display_name']
        }],
        attributes: ['recording_url', 'call_status', 'last_updated'],
        order: [['start_date', 'ASC']]
    });

    return records.map(r => {
        const data = r.toJSON();
        return {
            recording_url: data.recording_url,
            call_status: data.call_status,
            display_name: data.acdStatus?.display_name,
            last_updated: data.last_updated
        };
    });
};

/**
 * Marks demo as accepted by vendor with ownership verification.
 */
export const acceptDemo = async (vendor_id, data) => {
    const { acd_uuid, lead_id } = data;

    await verifyLeadOwnership(vendor_id, lead_id);

    await TblRequestCallbacks.update(
        { call_status: 7, vendor_id: vendor_id },
        { where: { acd_uuid: acd_uuid, lead_id: lead_id } }
    );

    await KnowlarityHistory.create({
        acd_uuid: acd_uuid,
        type: 2,
        source: '2',
        status_id: 7,
        event_data: 'Accepted by vendor'
    });

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
export const rescheduleDemo = async (vendor_id, data) => {
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
        return { status: false, message: err.message };
    }
};

/**
 * Schedules a callback or demo.
 */
export const scheduleCallback = async (vendor_id, data) => {
    const { lead_id, date, hour, minute, action, agent_number } = data;

    const lead = await TblLeads.findOne({
        where: { id: lead_id, vendor_id: vendor_id }
    });
    if (!lead) throw new AppError("Unauthorized: Lead does not belong to vendor", StatusCodes.FORBIDDEN);

    let scheduledTime;
    if (date && hour && minute) {
        scheduledTime = `${date} ${hour}:${minute}:00`;
    } else {
        const now = new Date();
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
 * Get lead locations (States/Cities) for search filters.
 */
export const getLeadLocationsService = async (search_by, context_id) => {
    try {
        if (search_by === "state") {
            return await StateMaster.findAll({
                where: {
                    countries_id: 99,
                    status: 1,
                },
                attributes: [
                    ["state_id", "id"],
                    ["state_name", "text"],
                ],
                order: [["state_name", "ASC"]],
                raw: true,
            });
        } else if (search_by === "city") {
            if (!context_id) return [];
            return await CityMaster.findAll({
                where: {
                    state_id: context_id,
                    status: 1,
                    is_deleted: 0
                },
                attributes: [
                    ["city_id", "id"],
                    ["city_name", "text"],
                ],
                order: [["city_name", "ASC"]],
                raw: true,
            });
        }
        return [];
    } catch (error) {
        throw error;
    }
};

/**
 * Retrieves vendor phone numbers.
 */
export const getVendorContacts = async (vendor_id) => {
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
 * Orchestrates enrichment from Apollo.
 */
export const fetchLeadInsightsData = async (lead_id, vendor_id) => {
    const leadData = await TblLeads.findOne({
        attributes: ['id', 'email', 'company_id', 'category_id', 'leadinsight'],
        where: { id: lead_id }
    });

    if (!leadData) return 0;
    const { email, leadinsight, company_id, category_id } = leadData.toJSON();
    const domain = isBusinessEmail(email);
    let employeeCount = 0;
    let companyExists = false;
    if (company_id) {
        employeeCount = await CompaniesEmployees.count({
            where: { company_id: company_id }
        });

        companyExists = await Companies.count({
            where: { id: company_id }
        }) > 0;
    }

    if (!domain || (leadinsight === 1 && company_id && companyExists && employeeCount > 0)) {
        return { status: 1, message: "Company profile details found." };
    }

    let organization = null;
    const companyDetail = await Companies.findOne({
        attributes: ['id', 'domain', 'organization_id'],
        where: { domain: domain },
        raw: true
    });

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
        return { status: 0, msg: "API Key missing" };
    }

    const APOLLO_API_URL = process.env.APOLLO_API_URL || "https://api.apollo.io/api/v1/";
    const url = `${APOLLO_API_URL}organizations/enrich?domain=${encodeURIComponent(domain)}`;

    try {
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "Cache-Control": "no-cache",
                "Content-Type": "application/json",
                "x-api-key": apiKey
            }
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`HTTP Error: ${response.status} - ${errBody}`);
        }
        const data = await response.json();

        if (data.organization && data.organization.id) {
            const org = data.organization;
            const estimatedNumEmployees = org.estimated_num_employees || 0;
            const companySize = getCompanySize(estimatedNumEmployees);
            const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

            const newCompany = await Companies.create({
                organization_id: org.id,
                company: org.name || '',
                employees_size: companySize,
                industry: org.industry || '',
                website: org.website_url || '',
                domain: domain,
                company_linkedin_url: org.linkedin_url || '',
                facebook_url: org.facebook_url || '',
                twitter_url: org.twitter_url || '',
                company_street: org.street_address || '',
                company_city: org.city || '',
                company_state: org.state || '',
                company_country: org.country || '',
                company_postal_code: org.postal_code || '',
                company_address: org.raw_address || '',
                logo_url: org.logo_url || '',
                created_at: createdAt
            });
            const company_id = newCompany.id;

            return {
                status: 1,
                msg: "success",
                data: {
                    company_id,
                    organization_id: org.id,
                    domain
                }
            };
        } else {
            // Apollo Enrichment: Domain profile not found
        }
    } catch (error) {
        // Ignored
    }

    return { status: 0, msg: "organization not found", data: { domain } };
};

/**
 * Fetches employee list from Apollo.
 */
const getEmployeeList = async (domain, category_id, lead_id, companyDetails) => {
    const categoryParams = await getKeyData(category_id);
    const department = categoryParams?.search_keys || [];

    const empData = await employeeData(domain, department);
    const apolloPeopleIds = [];

    if (empData && empData.length > 0) {
        const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

        for (const employee of empData) {
            if (!employee.apollo_people_id) {
                continue;
            }

            apolloPeopleIds.push(employee.apollo_people_id);

            const existingEmployee = await CompaniesEmployees.findOne({
                attributes: ['id', 'company_id', 'emp_email', 'apollo_people_id', 'mapped_categories'],
                where: { apollo_people_id: employee.apollo_people_id },
                raw: true
            });

            if (existingEmployee) {
                const existingMapped = existingEmployee.mapped_categories || "";
                const mappedArray = existingMapped.split(',').map(s => s.trim()).filter(Boolean);
                let needsUpdate = false;
                let updatedMapped = existingMapped;

                if (!mappedArray.includes(String(category_id))) {
                    mappedArray.push(category_id);
                    updatedMapped = mappedArray.filter(Boolean).join(',');
                    needsUpdate = true;
                }

                const currentCompanyId = existingEmployee.company_id;
                const targetCompanyId = companyDetails.company_id;
                let finalCompanyId = currentCompanyId;

                if (targetCompanyId && currentCompanyId !== targetCompanyId) {
                    finalCompanyId = targetCompanyId;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    await CompaniesEmployees.update(
                        { mapped_categories: updatedMapped || null, company_id: finalCompanyId || null },
                        { where: { apollo_people_id: employee.apollo_people_id || null } }
                    );
                }
            } else {
                await CompaniesEmployees.create({
                    company_id: companyDetails.company_id || null,
                    emp_name: employee.emp_name || "",
                    linkedin_id: employee.linkedin_url || "",
                    twitter_id: employee.twitter_id || "",
                    photo: employee.photo || "",
                    designation: employee.designation || "",
                    apollo_people_id: employee.apollo_people_id || "",
                    mapped_categories: category_id ? String(category_id) : null,
                    created_at: createdAt || null
                });
            }
        }

        return { status: 1, msg: `${empData.length} Employee Found`, data: { apollo_people_ids: apolloPeopleIds } };
    }

    return { status: 0, msg: "No Employee Found", data: { apollo_people_ids: apolloPeopleIds } };
};

/**
 * Searches for people on Apollo.
 */
const employeeData = async (domain, department = []) => {
    const apiKey = process.env.APOLLO_API_KEY;
    const APOLLO_API_URL = process.env.APOLLO_API_URL || "https://api.apollo.io/api/v1/";
    const url = `${APOLLO_API_URL}mixed_people/api_search`;
    const headers = {
        "Accept": "application/json",
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
        "X-Api-Key": apiKey
    };

    let resArr = [];
    try {
        const payload = {
            q_organization_domains: domain,
            page: 1,
            per_page: 5
        };

        if (department && department.length > 0) {
            payload.person_titles = department;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new AppError(`HTTP Error: ${response.status}`, StatusCodes.INTERNAL_SERVER_ERROR);
        const data = await response.json();
        const people = (data.people || []).slice(0, 5);

        resArr = people.map(emp => {
            const firstName = emp.first_name || "";
            const lastName = emp.last_name || emp.last_name_obfuscated || "";
            const empName = emp.name || `${firstName} ${lastName}`.trim();
            return {
                apollo_people_id: emp.id,
                emp_name: empName || "Anonymous",
                linkedin_url: emp.linkedin_url || null,
                twitter_id: emp.twitter_url || null,
                photo: emp.photo_url || null,
                designation: emp.title || null
            };
        });

        if (resArr.length < 5 && department && department.length > 0) {
            const remainLen = 5 - resArr.length;
            const fallbackPayload = {
                q_organization_domains: domain,
                page: 1,
                per_page: 5
            };

            const responseNoQuery = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(fallbackPayload)
            });

            if (responseNoQuery.ok) {
                const dataNoQuery = await responseNoQuery.json();
                const morePeople = (dataNoQuery.people || []).slice(0, remainLen);

                resArr.push(...morePeople.map(emp => {
                    const firstName = emp.first_name || "";
                    const lastName = emp.last_name || emp.last_name_obfuscated || "";
                    const empName = emp.name || `${firstName} ${lastName}`.trim();
                    return {
                        apollo_people_id: emp.id,
                        emp_name: empName || "Anonymous",
                        linkedin_url: emp.linkedin_url || null,
                        twitter_id: emp.twitter_url || null,
                        photo: emp.photo_url || null,
                        designation: emp.title || null
                    };
                }));
            }
        }
    } catch (error) {
        // Ignored
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

        if (!response.ok) throw new AppError(`HTTP Error: ${response.status}`, StatusCodes.INTERNAL_SERVER_ERROR);
        const data = await response.json();

        if (data.matches && data.matches.length > 0) {
            for (const empData of data.matches) {
                if (empData.email) {
                    await CompaniesEmployees.update(
                        { emp_email: empData.email },
                        { where: { apollo_people_id: empData.id } }
                    );
                }
            }
        }
    } catch (error) {
        // Ignored
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
 * Wrapper for fetch.
 */
const fetchWithCurl = async (url, headers) => {
    const response = await fetch(url, { method: 'POST', headers });
    if (!response.ok) throw new AppError(`HTTP Error: ${response.status}`, StatusCodes.INTERNAL_SERVER_ERROR);
    return response;
};

export const getLeadInsightPlanDetails = async (vendor_id) => {
    const result = await OmsPiDetail.findOne({
        where: {
            vendor_id: vendor_id,
            plan_type: 'leadinsight'
        },
        order: [['id', 'DESC']]
    });
    return result ? result.toJSON() : null;
};

export const hasRecentSubmission = async (vendor_id) => {
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
export const getLeadInsights = async (vendor_id, lead_id) => {
    try {
        const full_access_plan_id = 38;
        const limited_access_plan_id = 39;

        const vendor = await Vendor.findByPk(vendor_id, {
            attributes: ['lead_insight_display']
        });

        if (!vendor || vendor.lead_insight_display != 1) {
            return null;
        }

        await verifyLeadOwnership(vendor_id, lead_id);

        let lead = await TblLeads.findByPk(lead_id, {
            attributes: ['id', 'user_id', 'customer_id', 'email', 'company_id', 'category_id', 'product_name', 'oms_pi_id', 'credit_used', 'status', 'lead_action', 'created_at', 'city', 'state', 'is_contact_viewed']
        });
        if (!lead) return null;

        const planDetails = await getLeadInsightPlanDetails(vendor_id);
        let plan_name = 'No Plan';
        let plan_id = '';

        if (planDetails) {
            const pi_status = planDetails.pi_status;
            const end_date = planDetails.end_date;
            const currentDate = new Date().toISOString().split('T')[0];

            if (pi_status == '3' && new Date(end_date).toISOString().split('T')[0] >= currentDate) {
                plan_id = planDetails.lead_plan_id;
                plan_name = planDetails.plan_name || 'Paid Access';
            } else {
                plan_id = limited_access_plan_id;
                plan_name = planDetails.plan_name || 'Full Free Access (Limited)';
            }
        } else {
            plan_id = limited_access_plan_id;
            plan_name = 'Free Access (Limited)';
        }

        if (plan_id == full_access_plan_id || lead.is_contact_viewed === 1) {
            await fetchLeadInsightsData(lead_id, vendor_id);
            // Re-fetch lead since fetchLeadInsightsData might have updated company_id and leadinsight
            lead = await TblLeads.findByPk(lead_id, {
                attributes: ['id', 'user_id', 'customer_id', 'email', 'company_id', 'category_id', 'product_name', 'oms_pi_id', 'credit_used', 'status', 'lead_action', 'created_at', 'city', 'state', 'is_contact_viewed']
            });
            if (!lead) return null;
        }

        const totalCredits = lead?.oms_pi_id ? await OmsPiDetail.sum('total_lead', {
            where: { id: lead.oms_pi_id }
        }) : 0;

        const usedCredits = lead?.oms_pi_id ? await TblLeads.sum('credit_used', {
            where: { oms_pi_id: lead.oms_pi_id, is_trashed: 0 }
        }) : 0;

        const latestCallback = await TblRequestCallbacks.findOne({
            where: { lead_id },
            order: [['created_at', 'DESC']],
            attributes: ['designation']
        });


        const vendorData = await Vendor.findByPk(vendor_id, {
            attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'dial_code']
        });

        const result = {
            customer_activity_details: {},
            customer_company_information: {},
            top_five_key_people: [],
            activity: [],
            device: 'web',
            leadinsight_plan_name: plan_name,
            leadinsight_plan_id: plan_id,
            total_credits: totalCredits,
            used_credits: usedCredits,
            lead_credit_used: lead.credit_used,
            full_access_plan_id,
            limited_access_plan_id,
            has_recent_submission: await hasRecentSubmission(vendor_id),
            vendor_data: vendorData || {},
            actions: await getLeadActions(lead),
            current_status: lead.status,
            current_action: lead.lead_action,
            buying_stage: (lead.status === 2 || lead.status === 12) ? 'Decision' : (lead.status === 1 ? 'Evaluation' : 'Awareness'),
            city: lead.city,
            state: lead.state,
            designation: latestCallback ? latestCallback.designation : null
        };

        if (lead.company_id) {
            let company = await Companies.findOne({
                attributes: [
                    ['id', 'company_id'],
                    ['company', 'name'],
                    ['employees_size', 'team_size'],
                    'industry',
                    'website',
                    ['company_linkedin_url', 'linkedin'],
                    'logo_url'
                ],
                where: { id: lead.company_id },
                raw: true
            });

            if (company && plan_id === limited_access_plan_id && lead.is_contact_viewed !== 1) {
                company.name = company.name ? company.name.substring(0, 5) + "********" : "********";
                company.website = company.website ? "********" : null;
                company.linkedin = company.linkedin ? "********" : null;
                company.logo_url = null;
            }

            if (company) {
                Object.assign(result, company);
            }
            result.customer_company_information = company || {};
            let keyPeople;
            if (lead.category_id) {
                keyPeople = await CompaniesEmployees.findAll({
                    attributes: ['id', 'company_id', 'emp_name', 'emp_email', 'linkedin_id', 'photo', 'designation', 'mapped_categories'],
                    where: {
                        company_id: lead.company_id,
                        [Op.and]: sequelize.literal(`FIND_IN_SET('${lead.category_id}', mapped_categories) > 0`)
                    },
                    limit: 5,
                    raw: true
                });
            }

            if ((!keyPeople || keyPeople.length === 0) && lead.company_id) {
                keyPeople = await CompaniesEmployees.findAll({
                    attributes: ['id', 'company_id', 'emp_name', 'emp_email', 'linkedin_id', 'photo', 'designation', 'mapped_categories'],
                    where: { company_id: lead.company_id },
                    limit: 5,
                    raw: true
                });
            }

            if (keyPeople && plan_id === limited_access_plan_id && lead.is_contact_viewed !== 1) {
                keyPeople = keyPeople.map(person => ({
                    ...person,
                    emp_name: person.emp_name ? person.emp_name.substring(0, 3) + "********" : "********",
                    emp_email: "********",
                    linkedin_id: person.linkedin_id ? "********" : null,
                    photo: null
                }));
            }

            result.top_five_key_people = keyPeople || [];
        }

        // 3. Fetch Buyer Activity Timeline from MongoDB
        if (lead.customer_id) {
            try {
                const db = mongoose.connection?.db;
                if (!db) {
                    return result;
                }
                const tracksCollection = db.collection('tracks');

                const guuids = await tracksCollection.distinct('feeds.guuid', {
                    'feeds.customer_id': String(lead.customer_id)
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
                            lead_details: '$feeds.changes',
                            created_at: '$created_at'
                        }
                    }
                ];
                const activities = await tracksCollection.aggregate(activityQuery).toArray();
                // Process activities to match timeline format
                const finalActivityMap = {};
                for (const activity of activities) {
                    let assetName = '';
                    let assetType = '';
                    const feedAction = activity.feed_action;

                    const productId = activity.page_info?.product_id || activity.product_info?.product_id || activity.formdata?.product_id;
                    let productName = activity.page_info?.product_name || activity.product_info?.product_name || activity.formdata?.product_name || activity.page_info?.title;
                    const categoryName = activity.page_info?.category_name || activity.product_info?.category_name;

                    let productVendorId = null;
                    if (productId || productName) {
                        try {
                            if (!TblProduct.associations.vendorBrandRelations) {
                                TblProduct.hasMany(VendorBrandRelation, { foreignKey: 'tbl_brand_id', sourceKey: 'brand_id', as: 'vendorBrandRelations' });
                            }
                            const productCondition = productId ? { product_id: productId } : { product_name: productName };
                            const productDetailsResult = await TblProduct.findOne({
                                attributes: ['product_name'],
                                where: productCondition,
                                include: [{
                                    model: VendorBrandRelation,
                                    as: 'vendorBrandRelations',
                                    attributes: ['vendor_id'],
                                    required: true
                                }]
                            });
                            const productDetails = productDetailsResult ? {
                                vendor_id: productDetailsResult.vendorBrandRelations[0]?.vendor_id,
                                product_name: productDetailsResult.product_name
                            } : null;
                            if (productDetails) {
                                productVendorId = productDetails.vendor_id;
                                if (!productName) productName = productDetails.product_name;
                            }
                        } catch (err) {
                            // Ignored
                        }
                    }

                    if (productName && (!productVendorId || String(productVendorId) === String(vendor_id))) {
                        assetName = (plan_id === limited_access_plan_id) ? (productName.substring(0, 5) + "********") : productName;
                        assetType = 'Product';
                    } else if (categoryName) {
                        assetName = (plan_id === limited_access_plan_id) ? (categoryName.substring(0, 5) + "********") : categoryName;
                        assetType = 'Category';
                    } else if (activity.page_url?.includes('techjockey.com') && feedAction === 'page_view') {
                        assetName = 'visited_home_page';
                        assetType = 'visited_home_page';
                    } else if (activity.formdata?.form_name === 'searchForm' && feedAction === 'form_submit') {
                        assetName = activity.formdata.keyword ? activity.formdata.keyword.replace(/\b\w/g, l => l.toUpperCase()) : 'Search';
                        assetType = 'searched_keyword';
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

                /**
                 * Formats activity text cleanly for React timeline.
                 */
                const getActivityByFeedAction = (asset_type, asset_name, activity_name, activity_count) => {
                    const countText = activity_count > 1 ? ` ${activity_count} times` : "";
                    let activity = "";
                    if (asset_type === 'searched_keyword' && activity_name === 'form_submit') {
                        activity = `Customer searched for "${asset_name}"${countText}`;
                    } else if (asset_type === 'visited_home_page' && activity_name === 'page_view') {
                        activity = `Customer visited Home Page${countText}`;
                    } else {
                        switch (activity_name) {
                            case 'lead_created':
                                activity = `Requested Demo for ${asset_name} ${asset_type}${countText}`;
                                break;
                            case 'page_view':
                                activity = `Frequently revisited the ${asset_name} page${countText}`;
                                break;
                            case 'form_submit':
                                activity = `Initiated call request for ${asset_name} ${asset_type}${countText}`;
                                break;
                            case 'checked_price':
                                activity = `Checked pricing options for ${asset_name} ${asset_type}${countText}`;
                                break;
                            case 'add_to_cart':
                                activity = `${asset_type} ${asset_name} has been added to the cart${countText}`;
                                break;
                            case 'add_to_wishlist':
                                activity = `${asset_type} ${asset_name} has been added to wishlist${countText}`;
                                break;
                            case 'read_reviews':
                                activity = `Read multiple product reviews for ${asset_name} ${asset_type}${countText}`;
                                break;
                            default:
                                activity = `Customer expressed interest in ${asset_name} ${asset_type}${countText}`;
                                break;
                        }
                    }
                    return activity;
                };

                const activityTimeline = [];
                for (const assetType of Object.keys(finalActivityMap)) {
                    for (const assetName of Object.keys(finalActivityMap[assetType])) {
                        for (const feedAction of Object.keys(finalActivityMap[assetType][assetName])) {
                            const details = finalActivityMap[assetType][assetName][feedAction];
                            const text = getActivityByFeedAction(assetType, assetName, feedAction, details.count);
                            if (text) {
                                activityTimeline.push({
                                    action: text,
                                    created_at: details.created_at
                                });
                            }
                        }
                    }
                }

                activityTimeline.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                if (plan_id === limited_access_plan_id && lead.is_contact_viewed !== 1) {
                    result.activity = activityTimeline.slice(0, 2);
                } else {
                    result.activity = activityTimeline.slice(0, 10);
                }
            } catch (mongoError) {
                // Ignored
            }
        }

        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const recentRequest = await VendorLeadInsightInterest.findOne({
            where: {
                vendor_id: vendor_id,
                submitted_at: {
                    [Op.gte]: twoDaysAgo
                }
            }
        });
        result.has_recent_submission = !!recentRequest;

        return result;
    } catch (error) {
        throw error;
    }
};

/**
 * Unlock lead insights interest.
 */
export const unlockLeadInsights = async (vendor_id, data) => {
    let { company, email, date = null, time = [], remark = null, gp = null } = data;

    if (!company || !email || !gp) {
        const vendor = await Vendor.findByPk(vendor_id);
        const vendorDetails = await VendorDetails.findOne({ where: { vendor_id } });

        if (!company && vendorDetails) company = vendorDetails.company;
        if (!email && vendor) email = vendor.email;
        if (!gp && vendor) gp = `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim();
    }

    const submitted_at = new Date();
    const createdAtStr = submitted_at.toISOString().slice(0, 19).replace('T', ' ');

    try {
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

        if (!Vendor.associations.manager) {
            Vendor.belongsTo(AdminUsers, { foreignKey: 'acc_manager_id', targetKey: 'adminusers_id', as: 'manager' });
        }
        const vendorRec = await Vendor.findOne({
            attributes: ['id'],
            where: { id: vendor_id },
            include: [{
                model: AdminUsers,
                as: 'manager',
                attributes: ['adminusers_email']
            }]
        });
        const toEmail = vendorRec?.manager?.adminusers_email || 'Aniruddha_chaturvedi@techjockey.com';

        await EmailQueue.create({
            to: toEmail,
            subject: `New Interest in Unlock Lead Insights from ${company}`,
            body: emailBody,
            type: 'lead_insight_interest',
            app: 'eseller',
            priority: 0,
            created_at: createdAtStr,
            updated_at: createdAtStr
        });

        return { status: true, message: 'Thank you for your interest! Our team will contact you shortly.' };
    } catch (err) {
        throw err;
    }
};

/**
 * Private helper to calculate working minutes between two dates.
 */
function getAvgTimeMinute(beginDate, endDate) {
    const begin = new Date(beginDate);
    const end = new Date(endDate);
    let totalMinutes = 0;

    const startHour = 10;
    const endHour = 19;

    let current = new Date(begin);
    while (current.toDateString() !== end.toDateString()) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            if (current.toDateString() === begin.toDateString()) {
                const h = begin.getHours();
                const m = begin.getMinutes();
                if (h < startHour) {
                    totalMinutes += (endHour - startHour) * 60;
                } else if (h < endHour) {
                    totalMinutes += (endHour * 60) - (h * 60 + m);
                }
            } else {
                totalMinutes += (endHour - startHour) * 60;
            }
        }
        current.setDate(current.getDate() + 1);
    }

    const dayOfWeek = end.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        if (begin.toDateString() === end.toDateString()) {
            const startH = begin.getHours();
            const startM = begin.getMinutes();
            const endH = end.getHours();
            const endM = end.getMinutes();

            const s = Math.max(startH * 60 + startM, startHour * 60);
            const e = Math.min(endH * 60 + endM, endHour * 60);
            if (e > s) {
                totalMinutes += (e - s);
            }
        } else {
            const h = end.getHours();
            const m = end.getMinutes();
            if (h >= startHour) {
                const e = Math.min(h * 60 + m, endHour * 60);
                totalMinutes += (e - startHour * 60);
            }
        }
    }
    return totalMinutes;
}

/**
 * Unlocks contact with ownership verification.
 */
export const unlockContact = async (vendor_id, lead_id) => {
    await verifyLeadOwnership(vendor_id, lead_id);

    const leadInfo = await TblLeads.findOne({
        where: { id: lead_id },
        attributes: ['id', 'vendor_id', 'created_at', 'is_contact_viewed', 'email', 'phone', 'dial_code', 'is_show_contact', 'product_id'],
        include: [{
            model: TblProduct,
            as: 'product',
            attributes: ['lead_model_type']
        }]
    });

    if (!leadInfo) throw new Error("Lead not found");

    const isInternational = leadInfo.dial_code !== '91';
    let canShowContact = isInternational || leadInfo.is_show_contact === 1;

    const leadModelType = leadInfo.product ? leadInfo.product.lead_model_type : 2;
    const isValidModel = [1, 3, 4, 7].includes(leadModelType);

    if (!canShowContact) {
        throw new Error("You do not have permission to view this contact.");
    }

    if (!isInternational && !isValidModel) {
        throw new Error("You do not have permission to view this contact.");
    }

    if (leadInfo.is_contact_viewed === 0) {
        await TblLeads.update(
            { is_contact_viewed: 1 },
            { where: { id: lead_id } }
        );

        const contactViewedCount = await LeadHistory.count({
            where: {
                lead_id: lead_id,
                type: 'contact_viewed'
            }
        });

        if (contactViewedCount === 0) {
            await LeadHistory.create({
                lead_id: lead_id,
                acd_uuid: '',
                type: 'contact_viewed',
                remark: 'Contact viewed by OEM'
            });

            try {
                const db = mongoose.connection?.db;
                if (db) {
                    await db.collection('tracks').insertOne({
                        lead_id: Number(lead_id),
                        feed_action: 'lead_contact_info',
                        feed_activity: 'OEM Clicked On Contact Info.',
                        created_at: new Date()
                    });
                }
            } catch (mongoErr) {
                // Ignored
            }

            try {
                const countVal = await LeadsCallAttempt.count({
                    where: { lead_id: lead_id }
                });
                if (countVal === 0) {
                    const lead_avg_time = getAvgTimeMinute(leadInfo.created_at, new Date());

                    await LeadsCallAttempt.create({
                        lead_id: leadInfo.id,
                        vendor_id: leadInfo.vendor_id,
                        attempt_time: lead_avg_time,
                        lead_date: leadInfo.created_at,
                        lead_attempt_date: new Date()
                    });

                    const lead_date = new Date(leadInfo.created_at).toISOString().split('T')[0];
                    const today = new Date().toISOString().split('T')[0];
                    if (today > lead_date) {
                        await VendorAnalytics.increment({
                            total_attempt_lead: 1,
                            total_attempt_time: lead_avg_time,
                            utilised_leads: 1
                        }, {
                            where: { vendor_id: leadInfo.vendor_id, logic_date: lead_date }
                        });
                    }
                }
            } catch (sqlErr) {
                // Ignored
            }
        }
    }

    const updatedLead = await TblLeads.findOne({
        where: { id: lead_id },
        attributes: ['email', 'phone']
    });

    return {
        status: true,
        message: 'Contact unlocked successfully',
        email: updatedLead ? updatedLead.email : null,
        phone: updatedLead ? updatedLead.phone : null,
        is_show_contact: canShowContact ? 1 : 0
    };
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
export const getLeadActions = async (lead) => {
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

/**
 * Get lead insights with ownership verification.
 */

export const getLeadCompetiterInsights = async (vendor_id, lead_id) => {
    try {
        const vendor = await Vendor.findByPk(vendor_id, {
            attributes: ['lead_insight_display']
        });

        if (!vendor || vendor.lead_insight_display != 1) {
            return null;
        }

        const lead = await TblLeads.findByPk(lead_id, {
            attributes: ['id', 'user_id', 'customer_id', 'email', 'company_id', 'category_id', 'product_id', 'product_name', 'oms_pi_id', 'credit_used', 'status', 'lead_action', 'created_at', 'city', 'state']
        });
        if (!lead) return null;

        if (lead.customer_id) {
            const db = mongoose.connection?.db;
            if (!db) {
                return result;
            }
            let customerRelatedData = await getCustomerRelatedGuuids(lead.customer_id);
            let guuids = customerRelatedData.map(item => item.guuid);
            const activityQuery = [
                {
                    $match: {
                        $or: [
                            { "feeds.guuid": { $in: guuids } },
                        ],
                    },
                },

                {
                    $unwind: "$feeds",
                },

                // filter category + exclude current/lead product
                {
                    $match: {
                        "feeds.page_info.category_id": String(lead.category_id),

                        "feeds.page_info.product_id": {
                            $exists: true,
                            $ne: null,
                            $nin: [
                                String(lead.product_id), // external lead/current product id
                                Number(lead.product_id),
                            ],
                        },
                    },
                },

                // group by product
                {
                    $group: {
                        _id: "$feeds.page_info.product_id",

                        product_id: {
                            $first: "$feeds.page_info.product_id",
                        },

                        product_name: {
                            $first: "$feeds.page_info.product_name",
                        },

                        visits: {
                            $sum: 1,
                        },
                    },
                },

                // sort by most visited
                {
                    $sort: {
                        visits: -1,
                    },
                },

                {
                    $project: {
                        _id: 0,
                        product_id: 1,
                        product_name: 1,
                        visits: 1,
                    },
                },

                {
                    $limit: 20,
                },
            ];
            const mongoCompassQuery = `db.tracks.aggregate(${JSON.stringify(activityQuery, null, 2)})`;
            const tracksCollection = db.collection('tracks');
            const relatedProducts = await tracksCollection.aggregate(activityQuery).toArray();
            return relatedProducts;
        }
    } catch (error) {
        throw error;
    }
}


export const getCustomerRelatedGuuids = async (customerId) => {
    try {
        const db = mongoose.connection?.db;
        if (!db) {
            return [];
        }

        const tracksCollection = db.collection("tracks");

        const runAggregation = async (customerIdValue) => {
            return await tracksCollection
                .aggregate(
                    [
                        {
                            $unwind: "$feeds",
                        },
                        {
                            $match: {
                                "feeds.customer_id": customerIdValue,
                                "feeds.guuid": {
                                    $exists: true,
                                    $ne: null,
                                },
                            },
                        },
                        {
                            $sort: {
                                "feeds.created_at": -1,
                            },
                        },
                        {
                            $group: {
                                _id: "$feeds.guuid",
                                guuid: {
                                    $first: "$feeds.guuid",
                                },
                            },
                        },
                        {
                            $limit: 10,
                        },
                        {
                            $project: {
                                _id: 0,
                                guuid: 1,
                            },
                        },
                    ],
                    {
                        batchSize: 10,
                    }
                )
                .toArray();
        };

        // First try string customer_id
        let customerRelatedGuuids = await runAggregation(
            String(customerId)
        );

        // Retry with number customer_id if empty
        if (!customerRelatedGuuids.length) {
            customerRelatedGuuids = await runAggregation(
                Number(customerId)
            );
        }

        return customerRelatedGuuids;
    } catch (error) {

        return [];
    }
};