
import VendorReqQuery from "../models/help-Support/helpAndSupport.js";

export const insertVendorHelpQuery = async (helpData) => {
    try {
        const result = await VendorReqQuery.create({
            vendor_id: helpData.vendor_id,
            name: helpData.name,
            email: helpData.email,
            query: helpData.query,
            created_at: new Date(),
        });

        return result.id;
    } catch (error) {
        throw error;
    }
};
