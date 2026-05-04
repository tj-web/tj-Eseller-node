import {
    getLeads,
    getDemos,
    getLeadHistory,
    addRemarkReminder,
    leadStatusHandler,
    getLeadDetails,
    setFollowup,
    getLeadAcdHistory,
    acceptDemo,
    rescheduleDemo,
    scheduleCallback,
    getVendorContacts,
    getLeadInsights,
    unlockLeadInsights,
    unlockContact
} from "./manageLeads.service.js";
import SystemResponse from "../../utilis/systemResponse.js";
import StatusCodes from "../../utilis/statusCodes.js";

export const getLeadsController = async (req, res) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await getLeads(vendor_id, req.query);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Leads fetched successfully", result));
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(SystemResponse.internalServerError(error.message));
    }
};

export const getDemosController = async (req, res) => {
    try {
        const vendor_id = req.user.vendor_id;
        const { type, acd_uuid } = req.query;
        const result = await getDemos(vendor_id, req.query, type, acd_uuid);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Demos fetched successfully", result));
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(SystemResponse.internalServerError(error.message));
    }
};

export const getLeadHistoryController = async (req, res) => {
    try {
        const vendor_id = req.user.vendor_id;
        const lead_id = req.query.lead_id;
        const result = await getLeadHistory(vendor_id, lead_id);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Lead history fetched successfully", result));
    } catch (error) {
        const status = error.message.includes("Unauthorized") ? StatusCodes.FORBIDDEN : StatusCodes.INTERNAL_SERVER_ERROR;
        return res.status(status).json(SystemResponse.getErrorResponse(error.message, null, status));
    }
};

export const addRemarkReminderController = async (req, res) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await addRemarkReminder({ ...req.body, vendor_id, source: 'web' });
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Remark/Reminder added successfully", result));
    } catch (error) {
        const status = error.message.includes("Unauthorized") ? StatusCodes.FORBIDDEN : StatusCodes.INTERNAL_SERVER_ERROR;
        return res.status(status).json(SystemResponse.getErrorResponse(error.message, null, status));
    }
};

export const leadStatusHandlerController = async (req, res) => {
    try {
        const vendor_id = req.user.vendor_id;
        const { lead_id } = req.query.lead_id ? req.query : req.body;
        const result = await leadStatusHandler(vendor_id, { ...req.body, lead_id });
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Lead status updated successfully", result));
    } catch (error) {
        const status = error.message.includes("Unauthorized") ? StatusCodes.FORBIDDEN : StatusCodes.INTERNAL_SERVER_ERROR;
        return res.status(status).json(SystemResponse.getErrorResponse(error.message, null, status));
    }
};

export const getLeadDetailsController = async (req, res) => {
    try {
        const vendor_id = req.user.vendor_id;
        const lead_id = req.query.lead_id;
        const result = await getLeadDetails(vendor_id, lead_id);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Lead details fetched successfully", result));
    } catch (error) {
        const status = error.message.includes("Unauthorized") ? StatusCodes.FORBIDDEN : StatusCodes.INTERNAL_SERVER_ERROR;
        return res.status(status).json(SystemResponse.getErrorResponse(error.message, null, status));
    }
};

export const setFollowupController = async (req, res) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await setFollowup(vendor_id, { ...req.body });
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Follow-up set successfully", result));
    } catch (error) {
        const status = error.message.includes("Unauthorized") ? StatusCodes.FORBIDDEN : StatusCodes.INTERNAL_SERVER_ERROR;
        return res.status(status).json(SystemResponse.getErrorResponse(error.message, null, status));
    }
};

export const getLeadAcdHistoryController = async (req, res) => {
    try {
        const vendor_id = req.user.vendor_id;
        const { acd_uuid, type } = req.query;
        const result = await getLeadAcdHistory(vendor_id, acd_uuid, type);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("ACD history fetched successfully", result));
    } catch (error) {
        const status = error.message.includes("Unauthorized") ? StatusCodes.FORBIDDEN : StatusCodes.INTERNAL_SERVER_ERROR;
        return res.status(status).json(SystemResponse.getErrorResponse(error.message, null, status));
    }
};

export const acceptDemoController = async (req, res) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await acceptDemo(vendor_id, { ...req.body });
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Demo accepted successfully", result));
    } catch (error) {
        const status = error.message.includes("Unauthorized") ? StatusCodes.FORBIDDEN : StatusCodes.INTERNAL_SERVER_ERROR;
        return res.status(status).json(SystemResponse.getErrorResponse(error.message, null, status));
    }
};

export const rescheduleDemoController = async (req, res) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await rescheduleDemo(vendor_id, { ...req.body });
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Demo rescheduled successfully", result));
    } catch (error) {
        const status = error.message.includes("Unauthorized") ? StatusCodes.FORBIDDEN : StatusCodes.INTERNAL_SERVER_ERROR;
        return res.status(status).json(SystemResponse.getErrorResponse(error.message, null, status));
    }
};

export const scheduleCallbackController = async (req, res) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await scheduleCallback(vendor_id, { ...req.body });
        if (result.status) {
            return res.status(StatusCodes.SUCCESS).json(SystemResponse.success(result.message, result.data));
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(SystemResponse.getErrorResponse(result.message, result.data));
        }
    } catch (error) {
        const status = error.message.includes("Unauthorized") ? StatusCodes.FORBIDDEN : StatusCodes.INTERNAL_SERVER_ERROR;
        return res.status(status).json(SystemResponse.getErrorResponse(error.message, null, status));
    }
};

export const getVendorContactsController = async (req, res) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await getVendorContacts(vendor_id);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Vendor contacts fetched successfully", result));
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(SystemResponse.internalServerError(error.message));
    }
};

export const getLeadInsightsController = async (req, res) => {
    try {
        const vendor_id = req.user.vendor_id;
        const lead_id = req.query.lead_id;
        const result = await getLeadInsights(vendor_id, lead_id);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Lead insights fetched successfully", result));
    } catch (error) {
        const status = error.message.includes("Unauthorized") ? StatusCodes.FORBIDDEN : StatusCodes.INTERNAL_SERVER_ERROR;
        return res.status(status).json(SystemResponse.getErrorResponse(error.message, null, status));
    }
};

export const unlockContactController = async (req, res) => {
    try {
        const vendor_id = req.user.vendor_id;
        const { lead_id } = req.query.lead_id ? req.query : req.body;
        const result = await unlockContact(vendor_id, lead_id);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Contact unlocked successfully", result));
    } catch (error) {
        const status = error.message.includes("Unauthorized") ? StatusCodes.FORBIDDEN : StatusCodes.INTERNAL_SERVER_ERROR;
        return res.status(status).json(SystemResponse.getErrorResponse(error.message, null, status));
    }
};

export const unlockLeadInsightsController = async (req, res) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await unlockLeadInsights(vendor_id, { ...req.body });
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Lead insights unlocked successfully", result));
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(SystemResponse.internalServerError(error.message));
    }
};
