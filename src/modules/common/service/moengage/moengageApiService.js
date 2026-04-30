import axios from 'axios';

// Computed once at module load — env vars don't change at runtime
const MOENGAGE_URL = `https://api-03.moengage.com/v1/transition/${process.env.MOENGAGE_APP_ID_ESELLER}`;
const MOENGAGE_AUTH_HEADER = `Basic ${Buffer.from(
    `${process.env.MOENGAGE_API_ID_ESELLER}:${process.env.MOENGAGE_API_KEY_ESELLER}`
).toString('base64')}`;

// Reusable axios instance — keeps connections alive, headers preset
const moengageClient = axios.create({
    baseURL: MOENGAGE_URL,
    headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        Authorization: MOENGAGE_AUTH_HEADER,
    },
});

const oemAnalyticsEvent = async (data) => {
    try {
        const { data: responseData } = await moengageClient.post('', data);
        return responseData;
    } catch (error) {
        return error.response?.data || error.message;
    }
};

export const sendProductBrandUpdationEvents = async (moengageData) => {
    const validProfileIds = (moengageData.profile_ids ?? []).filter(Boolean);
    if (validProfileIds.length === 0) return;

    // Build attributes once — shared by reference across all elements
    const attributes = moengageData.data
        ? Object.fromEntries(
              Object.entries(moengageData.data).filter(([, v]) => Boolean(v))
          )
        : {};

    const currentTime = Math.floor(Date.now() / 1000);
    const eventName = moengageData.event_name;

    // Build the action object once, reuse across elements
    const action = { action: eventName, attributes, current_time: currentTime };

    const elements = validProfileIds.map((customerId) => ({
        customer_id: customerId,
        type: 'event',
        actions: [action],
    }));

    return oemAnalyticsEvent({ type: 'transition', elements });
};