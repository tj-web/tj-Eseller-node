import VendorReqQuery from "../../models/helpSupport.model.js";
import Vendor from "../../models/vendor.model.js";
import AdminUsers from "../../models/adminUser.model.js";
import { queueEmail } from "../common/service/emailService.js";
import { AppError } from "../../utilis/appError.js";
import StatusCodes from "../../utilis/statusCodes.js";
import { renderTemplate } from "../../helpers/emailHelper.js";

export const insertVendorHelpQuery = async (helpData) => {
    try {
        const result = await VendorReqQuery.create({
            vendor_id: helpData.vendor_id,
            name: helpData.name,
            email: helpData.email,
            query: helpData.query,
            created_at: new Date(),
        });

        // Fetch Manager Email using Sequelize ORM
        const vendor = await Vendor.findOne({
            where: { id: Number(helpData.vendor_id) },
            attributes: ["acc_manager_id"],
        });

        let managerEmail = "support@techjockey.com";
        if (vendor && vendor.acc_manager_id) {
            const manager = await AdminUsers.findOne({
                where: { adminusers_id: vendor.acc_manager_id },
                attributes: ["adminusers_email"],
            });
            if (manager && manager.adminusers_email) {
                managerEmail = manager.adminusers_email;
            }
        }

        // Send Email to Manager
        const emailBody = await renderTemplate("contact-us", {
            vendor_id: helpData.vendor_id,
            callback_name: helpData.name,
            callback_email: helpData.email,
            help_query: helpData.query,
        });

        await queueEmail({
            to: managerEmail,
            cc: "support@techjockey.com",
            subject: `New Help Query from ${helpData.name}`,
            body: emailBody,
            type: "help_query",
            table_column: "vendor_id",
            column_value: helpData.vendor_id,
        });

        return result.id;
    } catch (error) {
        throw new AppError(error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
};
