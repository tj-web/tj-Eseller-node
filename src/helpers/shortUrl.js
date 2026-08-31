import axios from "axios";

/**
 * Shortens a long URL using the tj.link REST API service.
 * @param {string} longUrl - The redirect URL to shorten.
 * @returns {Promise<string>} The shortened URL or the original longUrl if the shortening fails.
 */
export const getShortUrl = async (longUrl) => {
  try {
    const apiUrl = process.env.TJ_LINK_API_URL;
    const authKey = process.env.TJ_LINK_AUTH_KEY;

    if (!authKey) {
      console.warn("[UrlShortener Warning] TJ_LINK_AUTH_KEY is missing in environment variables.");
      return longUrl;
    }

    const response = await axios.post(
      `${apiUrl}/generateUrl`,
      { redirectUrl: longUrl },
      {
        headers: {
          auth_key: authKey,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );

    if (response.data && response.data.shortUrl) {
      return response.data.shortUrl;
    }

    if (response.data && response.data.error) {
      console.error("[UrlShortener Error] API returned error:", response.data.message);
    }

    return longUrl;
  } catch (error) {
    console.error("[UrlShortener Error] Failed to generate short URL:", error.message);
    return longUrl;
  }
};
