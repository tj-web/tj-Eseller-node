import * as oemDashboardActions from "./oemDashboard.service.js";
import SystemResponse from "../../utilis/systemResponse.js";
import StatusCodes from "../../utilis/statusCodes.js";

const parseFilters = (req) => {
    const { date_from, date_to, product_id, plan_scope } = req.query;
    return {
        date_from,
        date_to,
        product_id: product_id ? Number(product_id) : undefined,
        plan_scope: plan_scope === "current" ? "current" : "all",
    };
};

const requireDateRange = (filters, res) => {
    if (!filters.date_from || !filters.date_to) {
        res.status(StatusCodes.BAD_REQUEST).json(
            SystemResponse.badRequestError("date_from and date_to are required.")
        );
        return false;
    }
    return true;
};

export const getProducts = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const result = await oemDashboardActions.getVendorProducts(vendor_id);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Products fetched successfully", result));
    } catch (error) {
        next(error);
    }
};

export const getSummary = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const filters = parseFilters(req);
        if (!requireDateRange(filters, res)) return;

        const result = await oemDashboardActions.getSummary(vendor_id, filters);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Summary fetched successfully", result));
    } catch (error) {
        next(error);
    }
};

export const getImpressionsTrend = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const filters = parseFilters(req);
        if (!requireDateRange(filters, res)) return;

        const result = await oemDashboardActions.getImpressionsTrend(vendor_id, filters);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Impressions trend fetched successfully", result));
    } catch (error) {
        next(error);
    }
};

export const getOpportunitiesTrend = async (req, res, next) => {
    try {
        const vendor_id = req.user.vendor_id;
        const filters = {
            ...parseFilters(req),
            bucket: req.query.bucket === "daily" ? "daily" : "weekly",
        };
        if (!requireDateRange(filters, res)) return;

        const result = await oemDashboardActions.getOpportunitiesTrend(vendor_id, filters);
        return res.status(StatusCodes.SUCCESS).json(SystemResponse.success("Opportunities trend fetched successfully", result));
    } catch (error) {
        next(error);
    }
};
