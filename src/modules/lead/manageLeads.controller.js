import * as leadActions from "./manageLeads.service.js";
import SystemResponse from "../../utilis/systemResponse.js";
import StatusCodes from "../../utilis/statusCodes.js";

export const getLeads = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await leadActions.getLeads(vendor_id, req.query);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Leads fetched successfully", result));
    } catch (error) {
        next(error);
    }
};

export const getPendingLeadsCount = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await leadActions.getPendingLeadsCount(vendor_id);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Pending leads count fetched successfully", result));
    } catch (error) {
        next(error);
    }
};

export const getDemos = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const { type, acd_uuid } = req.query;
        const result = await leadActions.getDemos(vendor_id, req.query, type, acd_uuid);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Demos fetched successfully", result));
    } catch (error) {
        next(error);
    }
};

export const getLeadHistory = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const lead_id = req.query.lead_id;
        const result = await leadActions.getLeadHistory(vendor_id, lead_id);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Lead history fetched successfully", result));
    } catch (error) {
        next(error);
    }
};

export const addRemarkReminder = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await leadActions.addRemarkReminder({ ...req.body, vendor_id, source: 'web' });
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Remark/Reminder added successfully", result));
    } catch (error) {
        next(error);
    }
};

export const leadStatusHandler = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const { lead_id } = req.query.lead_id ? req.query : req.body;
        const result = await leadActions.leadStatusHandler(vendor_id, { ...req.body, lead_id });
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Lead status updated successfully", result));
    } catch (error) {
        next(error);
    }
};

export const getLeadDetails = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const lead_id = req.query.lead_id;
        const result = await leadActions.getLeadDetails(vendor_id, lead_id);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Lead details fetched successfully", result));
    } catch (error) {
        next(error);
    }
};

export const setFollowup = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await leadActions.setFollowup(vendor_id, { ...req.body });
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Follow-up set successfully", result));
    } catch (error) {
        next(error);
    }
};

export const getLeadAcdHistory = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const { acd_uuid, type } = req.query;
        const result = await leadActions.getLeadAcdHistory(vendor_id, acd_uuid, type);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("ACD history fetched successfully", result));
    } catch (error) {
        next(error);
    }
};

export const acceptDemo = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await leadActions.acceptDemo(vendor_id, { ...req.body });
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Demo accepted successfully", result));
    } catch (error) {
        next(error);
    }
};

export const rescheduleDemo = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await leadActions.rescheduleDemo(vendor_id, { ...req.body });
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Demo rescheduled successfully", result));
    } catch (error) {
        next(error);
    }
};

export const scheduleCallback = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await leadActions.scheduleCallback(vendor_id, { ...req.body });
        if (result.status) {
            return res.status(StatusCodes.SUCCESS).json(SystemResponse.success(result.message, result.data));
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(SystemResponse.getErrorResponse(result.message, result.data));
        }
    } catch (error) {
        next(error);
    }
};

export const getVendorContacts = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await leadActions.getVendorContacts(vendor_id);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Vendor contacts fetched successfully", result));
    } catch (error) {
        next(error);
    }
};

export const getLeadInsights = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const lead_id = req.query.lead_id;
        const result = await leadActions.getLeadInsights(vendor_id, lead_id);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Lead insights fetched successfully", result));
    } catch (error) {
        next(error);
    }
};

export const unlockContact = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const { lead_id } = req.query.lead_id ? req.query : req.body;
        const result = await leadActions.unlockContact(vendor_id, lead_id);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Contact unlocked successfully", result));
    } catch (error) {
        next(error);
    }
};

export const unlockLeadInsights = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await leadActions.unlockLeadInsights(vendor_id, { ...req.body });
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Lead insights unlocked successfully", result));
    } catch (error) {
        next(error);
    }
};

export const getLeadLocations = async (req, res, next) => {
    try {
        const { search_by, context_id } = req.query;
        if (!search_by) {
            return res.status(StatusCodes.BAD_REQUEST).json(SystemResponse.badRequestError("search_by is required (state/city)"));
        }
        const results = await leadActions.getLeadLocations(search_by, context_id);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Locations fetched successfully", results));
    } catch (error) {
        next(error);
    }
};

export const getCompetiterInsights = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const lead_id = req.query.lead_id;
        const results = await leadActions.getLeadCompetiterInsights(vendor_id, lead_id);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Competiter Insights fetched successfully", results));
    } catch (error) {
        next(error);
    }
}
