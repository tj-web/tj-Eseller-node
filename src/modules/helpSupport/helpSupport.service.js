import VendorReqQuery from "../../models/helpSupport.model.js";
import sequelize from "../../db/connection.js";
import { queueEmail } from "../common/service/emailService.js";

export const insertVendorHelpQuery = async (helpData) => {
    try {
        const result = await VendorReqQuery.create({
            vendor_id: helpData.vendor_id,
            name: helpData.name,
            email: helpData.email,
            query: helpData.query,
            created_at: new Date(),
        });

        // Fetch Manager Email
        const [managerData] = await sequelize.query(
            `
            SELECT au.adminusers_email AS email
            FROM vendors v
            LEFT JOIN tbl_adminusers au ON au.adminusers_id = v.acc_manager_id
            WHERE v.id = :vendor_id
            `,
            {
                replacements: { vendor_id: Number(helpData.vendor_id) },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        const managerEmail = managerData?.email || "support@techjockey.com";

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
        console.error("Error in insertVendorHelpQuery:", error);
        throw error;
    }
};
