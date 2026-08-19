const { LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, HTTP_SCHEME, APP_URL, API_VERSION_PATH, FRONTEND_URL } =
  process.env;

const APP_HOST = APP_URL?.replace(/\/$/, "");
const LINKEDIN_CALLBACK_URL = `${HTTP_SCHEME}://${APP_HOST}${API_VERSION_PATH}/auth/linkedin/callback`;

const OAUTH_BASE = "https://www.linkedin.com/oauth/v2";
const API_BASE = "https://api.linkedin.com/v2";

export const LINKEDIN_CONFIG = {
  authUrl: `${OAUTH_BASE}/authorization`,
  tokenUrl: `${OAUTH_BASE}/accessToken`,
  profileUrl: `${API_BASE}/me`,
  emailUrl: `${API_BASE}/emailAddress?q=members&projection=(elements*(handle~))`,
  clientId: LINKEDIN_CLIENT_ID,
  clientSecret: LINKEDIN_CLIENT_SECRET,
  callbackUrl: LINKEDIN_CALLBACK_URL,
  scope: "r_liteprofile r_emailaddress",
  successRedirect: `${FRONTEND_URL}/dashboard`,
  failureRedirect: `${FRONTEND_URL}/authenticate`,
};
