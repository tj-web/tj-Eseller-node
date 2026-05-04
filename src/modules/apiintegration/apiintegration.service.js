import axios from "axios";
import VendorWebhookAuth from "../../models/vendorWebhookAuth.model.js";

const mapCredentialsToColumns = (auth_type, credentials = {}) => {
  switch (auth_type) {
    case "Basic Auth":
      return {
        client_id: credentials.username || "",
        client_secret: credentials.password || "",
        send_basic_auth: 1,
      };
    case "API Key":
      return {
        client_id: "api_key",
        client_secret: credentials.api_key || "",
        send_basic_auth: 0,
      };
    case "Bearer Token":
      return {
        client_id: "bearer",
        client_secret: credentials.bearer_token || "",
        send_basic_auth: 0,
      };
    case "OAuth 2.0":
      return {
        client_id: credentials.client_id || "",
        client_secret: credentials.client_secret || "",
        send_basic_auth: 0,
      };
    default:
      return { client_id: "", client_secret: "", send_basic_auth: 0 };
  }
};

const valiDateCredentials = (auth_type, credColumns) => {
  if (!credColumns.client_secret) {
    throw new Error("Authentication credentials are required");
  }
  if (auth_type === "Basic Auth" && !credColumns.client_id) {
    throw new Error("Username is required for Basic Auth");
  }
};

export const handleCreateWebhook = async ({
  vendor_id,
  webhook_url,
  auth_type,
  credentials,
  fields,
}) => {
  if (!webhook_url || !auth_type) {
    throw new Error("webhook_url and auth_type are required");
  }
  const credColumns = mapCredentialsToColumns(auth_type, credentials);

  valiDateCredentials(auth_type, credColumns);
  const payload = {
    vendor_id,
    ...credColumns,
    auth: auth_type,
    headers: JSON.stringify(["Content-Type: application/json"]),
    request_url: webhook_url,
    http_action: "POST",
    format: JSON.stringify(Array.isArray(fields) ? fields : []),
    default_format: 1,
    status: 1,
  };
  const response = await VendorWebhookAuth.create(payload);
  return {
    webhook_url: response.request_url,
    auth_type: response.auth,
    status: response.status,
  };
};

export const handleverifyWebhook = async (webhook_url) => {
  if (!webhook_url) {
    throw new Error("webhook_url is required");
  }

  try {
    const response = await axios.get(webhook_url, {
      timeout: 10000,
      validateStatus: () => true,
    });

    const isOk = response.status >= 200 && response.status < 300;

    return {
      ok: isOk,
      status_code: response.status,
      message: isOk
        ? "Webhook URL is reachable"
        : `Webhook URL responded with HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      status_code: 0,
      message: "Webhook URL unreachable",
      error:
        error.code === "ECONNABORTED"
          ? "Request timed out"
          : error.code === "ENOTFOUND"
            ? "Could not resolve hostname"
            : error.code === "ECONNREFUSED"
              ? "Connection refused"
              : error.message,
    };
  }
};
