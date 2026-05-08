import express from "express";
import crypto from "crypto";

const router = express.Router();
const {
  LINKEDIN_AUTH_URL,
  LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET,
  LINKEDIN_CALLBACK_URL,   // e.g. https://api.yourapp.com/auth/linkedin/callback
  FRONTEND_URL,            // e.g. https://yourapp.com
  JWT_SECRET,
} = process.env;

router.get("/initiate", (req, res) => { 
    const state = crypto.randomBytes(16).toString("hex");

    res.cookie("li_oauth_state", state, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 5 * 60 * 1000,
    });

    const params = new URLSearchParams({
        response_type: "code",
        client_id: LINKEDIN_CLIENT_ID,
        redirect_uri: LINKEDIN_CALLBACK_URL,
        state,
        scope: "r_liteprofile%20r_emailaddress", // current LinkedIn scopes — see note below
    });

    res.redirect(`${LINKEDIN_AUTH_URL}?${params}`);    
});

router.get("/callback", async(req, res) => {
    try {
        const { code, state } = req.query;
        const cookieState = req.cookies?.li_oauth_state;
        res.clearCookie("li_oauth_state");

        if (!code) throw new Error("Missing authorization code");
        if (!state || state !== cookieState) throw new Error("CSRF state mismatch");

        const tokenResp = await axios.post(
          "https://www.linkedin.com/oauth/v2/accessToken",
          new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: LINKEDIN_CALLBACK_URL,
            client_id: LINKEDIN_CLIENT_ID,
            client_secret: LINKEDIN_CLIENT_SECRET,
          }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const accessToken = tokenResp.data.access_token;

        // Fetch profile (OpenID userinfo endpoint — simplest with current scopes)
        const userinfo = await axios.get("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const { sub: linkedinId, given_name, family_name, email } = userinfo.data;



    } catch (error) {
        console.error("LinkedIn auth error:", error.message);
        res.redirect(`${FRONTEND_URL}/authenticate?error=linkedin_failed`);
    }
});

export default router;