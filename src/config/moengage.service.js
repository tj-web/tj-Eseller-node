import axios from 'axios';

class MoengageService {
  constructor() {
    this.baseUrl = 'https://api-03.moengage.com/v1';

    this.appId = process.env.MOENGAGE_APP_ID_ESELLER;
    this.apiId = process.env.MOENGAGE_API_ID_ESELLER;
    this.apiKey = process.env.MOENGAGE_API_KEY_ESELLER;
    this.debugLog = process.env.MOENGAGE_DEBUG_LOG;
  }

  /**
   * Generates Basic Auth header required by MoEngage API
   */
  _getAuthHeader() {
    if (!this.apiId || !this.apiKey) {
      console.warn('[MoEngage Warning] MOENGAGE_API_ID_ESELLER or MOENGAGE_API_KEY_ESELLER is missing in environment variables.');
    }
    const credentials = `${this.apiId}:${this.apiKey}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  /**
   * Low-level HTTP POST request handler for MoEngage REST endpoints
   * @param {string} endpointType - 'event' or 'customer'
   * @param {object} payload - Request body
   */
  async _sendRequest(endpointType, payload) {
    try {
      if (!this.appId) {
        throw new Error('MOENGAGE_APP_ID_ESELLER is not defined');
      }

      const url = `${this.baseUrl}/${endpointType}/${this.appId}`;
      const authHeader = this._getAuthHeader();

      if (this.debugLog) {
        console.log(`[MoEngage Request] POST ${url}`, JSON.stringify(payload));
      }

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Authorization': authHeader,
        },
        timeout: 5000, // 5s timeout to avoid blocking execution
      });
      console.log(response);
      if (this.debugLog) {
        console.log(`[MoEngage Response]`, response.data);
      }

      return response.data;
    } catch (error) {
      console.error(
        `[MoEngage API Error] Endpoint: ${endpointType} | Error:`,
        error.response?.data || error.message
      );
      return null;
    }
  }

  /**
   * Core Event Tracking Method for Eseller
   * @param {string|number} identity - Customer / Vendor Profile ID
   * @param {string} eventName - Name of the event (e.g. 'OEM Login', 'OEM Demo Confirmed')
   * @param {object} attributes - Event attributes key-value map
   */
  async trackEsellerEvent(identity, eventName, attributes = {}) {
    const payload = {
      type: 'event',
      customer_id: String(identity),
      actions: [
        {
          action: eventName,
          attributes: attributes,
          current_time: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return this._sendRequest('event', payload);
  }

  /**
   * Updates Eseller Customer Profile attributes in MoEngage
   * @param {object} vendor - Vendor profile details object
   */
  async updateEsellerProfile(vendor) {
    const payload = {
      type: 'customer',
      customer_id: String(vendor.id),
      attributes: {
        'Profile Id': vendor.id,
        'Vendor Id': vendor.vendor_id,
        'Name': `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim(),
        'name': `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim(),
        'Email': (vendor.email || '').toLowerCase(),
        'email': (vendor.email || '').toLowerCase(),
        'Phone': vendor.phone ? `+${vendor.dial_code}${vendor.phone}` : '',
        'mobile': vendor.phone ? `+${vendor.dial_code}${vendor.phone}` : '',
        'Gender': vendor.gender || 'M',
        'Company Name': vendor.company || '',
        'City': vendor.city_name || vendor.city || 'N/A',
        'State': vendor.state_name || vendor.state || 'N/A',
        'Country': vendor.country_name || vendor.country || 'N/A',
        'Pincode': vendor.pincode || 'N/A',
        'Designation': vendor.designation || 'N/A',
        'Website': vendor.website || 'N/A',
        'Created At': vendor.created_at || new Date().toISOString(),
      },
    };

    return this._sendRequest('customer', payload);
  }
}

export default new MoengageService();
