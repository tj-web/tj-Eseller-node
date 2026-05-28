import StatusCodes from "../../utilis/statusCodes.js";
import SystemResponse from "../../utilis/systemResponse.js";
import { handleCreateWebhook, handleverifyWebhook } from "./apiintegration.service.js";

// export const createWebhook = async (req, res) => {
//   try {
//     const { vendor_id } = req.user;
//     const { webhook_url, auth_type, credentials, fields } = req.body;

//     if (!webhook_url || !auth_type)
//       return res
//         .status(StatusCodes.BAD_REQUEST)
//         .json(SystemResponse.badRequest("webhook_url and auth_type are required"));

//     const credColumns = mapCredentialsToColumns(auth_type, credentials);

//     // Reject if required credentials are missing
//     if (!credColumns.client_secret) {
//       return res
//         .status(StatusCodes.BAD_REQUEST)
//         .json(SystemResponse.badRequest("Authentication credentials are required"));
//     }
//     if (auth_type === "Basic Auth" && !credColumns.client_id) {
//       return res
//         .status(StatusCodes.BAD_REQUEST)
//         .json(SystemResponse.badRequest("Username is required for Basic Auth"));
//     }

//     const payload = {
//       vendor_id,
//       ...credColumns,
//       auth: auth_type,
//       headers: JSON.stringify(["Content-Type: application/json"]),
//       request_url: webhook_url,
//       http_action: "POST",
//       format: JSON.stringify(Array.isArray(fields) ? fields : []),
//       default_format: 1,
//       status: 1,
//     };

//     const response = await VendorWebhookAuth.create(payload);

//     return res.status(StatusCodes.SUCCESS).json(
//       SystemResponse.success("Webhook saved successfully", {
//         webhook_url: response.request_url,
//         auth_type: response.auth,
//         status: response.status,
//       })
//     );
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(StatusCodes.INTERNAL_SERVER_ERROR)
//       .json(SystemResponse.internalServerError(error.message || "Internal Server Error"));
//   }
// };

// export const verifyWebhook = async (req, res) => {
//   try {
//     const { vendor_id } = req.user;
//     const { webhook_url } = req.body;

//     if (!webhook_url) {
//       return res
//         .status(StatusCodes.BAD_REQUEST)
//         .json(SystemResponse.badRequest("webhook_url is required"));
//     }

//     const response = await axios.get(webhook_url, {
//       timeout: 10000,
//       validateStatus: () => true,
//     });
//     const isOk = response.status >= 200 && response.status < 300;
//     return res.status(StatusCodes.SUCCESS).json(
//       SystemResponse.success(
//         isOk ? "Webhook URL is reachable" : `Webhook URL responded with HTTP ${response.status}`,
//         {
//           ok: isOk,
//           status_code: response.status,
//         }
//       )
//     );
//   } catch (error) {
//     return res.status(StatusCodes.SUCCESS).json(
//       SystemResponse.success("Webhook URL unreachable", {
//         ok: false,
//         status_code: 0,
//         error:
//           error.code === "ECONNABORTED"
//             ? "Request timed out"
//             : error.code === "ENOTFOUND"
//               ? "Could not resolve hostname"
//               : error.code === "ECONNREFUSED"
//                 ? "Connection refused"
//                 : error.message,
//       })
//     );
//   }
// };

export const createWebhook = async (req, res) => {
  try {
    const { vendor_id } = req.user;

    const data = await handleCreateWebhook({
      vendor_id,
      ...req.body,
    });

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Webhook saved successfully", data));
  } catch (error) {
    console.log(error);
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(SystemResponse.internalServerError(error.message || "Failed to create webhook"));
  }
};

export const verifyWebhook = async (req, res) => {
  try {
    const result = await handleverifyWebhook(req.body.webhook_url);

    return res.status(StatusCodes.SUCCESS).json(SystemResponse.success(result.message, result));
  } catch (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(SystemResponse.badRequest(error.message || "Verification failed"));
  }
};
