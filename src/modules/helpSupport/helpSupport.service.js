import VendorReqQuery from "../../models/helpSupport.model.js";
import Vendor from "../../models/vendor.model.js";
import AdminUsers from "../../models/adminUser.model.js";
import sequelize from "../../db/connection.js";
import { queueEmail } from "../common/service/emailService.js";
import { AppError } from "../../utilis/appError.js";
import StatusCodes from "../../utilis/statusCodes.js";

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
        const emailBody = `
            <h3>New Help Support Query</h3>
            <p><strong>Vendor ID:</strong> ${helpData.vendor_id}</p>
            <p><strong>Vendor Name:</strong> ${helpData.name}</p>
            <p><strong>Vendor Email:</strong> ${helpData.email}</p>
            <p><strong>Query:</strong></p>
            <p>${helpData.query}</p>
        `;

        await queueEmail({
            to: managerEmail,
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
