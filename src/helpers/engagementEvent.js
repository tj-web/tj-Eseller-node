import moengageService from "../config/moengage.service.js";

const engagementProvider = process.env.ENGAGEMENT_PROVIDER || "moengage";

class EngagementEvent {
  get providerService() {
    switch (engagementProvider) {
      case "moengage":
        return moengageService;
      default:
        console.warn(`[Engagement Warning] Unsupported provider: ${engagementProvider}`);
        return null;
    }
  }

  /**
   * Fires OEM Login Event (Web / App)
   * @param {object} user - VendorAuth / Vendor object containing id, vendor_id, email, phone, etc.
   * @param {string} source - 'Web' or 'App'
   */
  async oemLoginEvent(user, source = "Web") {
    try {
      if (!user) return;

      const providerService = this.providerService;
      if (!providerService) return;

      const vendorObj = user.Vendor || user;
      const profileId = user.id;
      const vendorId = user.vendor_id;

      const firstName = vendorObj.first_name || user.first_name || "";
      const lastName = vendorObj.last_name || user.last_name || "";
      const email = user.email || vendorObj.email || "";
      const dialCode = user.dial_code || vendorObj.dial_code || "91";
      const phoneNum = user.phone || vendorObj.phone || vendorObj.number || "";
      const fullPhone = phoneNum ? `+${String(dialCode).replace("+", "")}${phoneNum}` : "";

      const attributes = {
        "Profile Id": profileId,
        "Vendor Id": vendorId,
        "First Name": firstName,
        "Last Name": lastName,
        "Email": email,
        "Phone": fullPhone,
        "Date": new Date().toISOString().replace("T", " ").substring(0, 19),
      };

      return await providerService.trackEsellerEvent(profileId, `OEM Login ${source}`, attributes);
    } catch (error) {
      console.error("[Engagement Event Error] Failed to process oemLoginEvent:", error);
    }
  }

  /**
   * Fires OEM Signup Event (Web / App)
   * @param {object} user - VendorAuth / Vendor object containing id/profile_id, vendor_id, first_name, last_name, email, phone, dial_code
   * @param {string} source - 'Web' or 'App'
   */
  async oemSignupEvent(user, source = "Web") {
    try {
      if (!user) return;

      const providerService = this.providerService;
      if (!providerService) return;

      const vendorObj = user.Vendor || user;
      const profileId = user.id;
      const vendorId = user.vendor_id;

      const firstName = vendorObj.first_name || user.first_name || "";
      const lastName = vendorObj.last_name || user.last_name || "";
      const email = user.email || vendorObj.email || "";
      const dialCode = user.dial_code || vendorObj.dial_code || "91";
      const phoneNum = user.phone || vendorObj.phone || vendorObj.number || user.contact_number || "";
      const fullPhone = phoneNum ? `+${String(dialCode).replace("+", "")}${phoneNum}` : "";

      const attributes = {
        "Profile Id": profileId,
        "Vendor Id": vendorId,
        "First Name": firstName,
        "Last Name": lastName,
        "Email": email,
        "Phone": fullPhone,
        "Date": new Date().toISOString().replace("T", " ").substring(0, 19),
      };

      return await providerService.trackEsellerEvent(profileId, `OEM Signup ${source}`, attributes);
    } catch (error) {
      console.error("[Engagement Event Error] Failed to process oemSignupEvent:", error);
    }
  }

  
  async updateEsellerProfile(vendor) {
    try {
      if (!vendor) return;

      const providerService = this.providerService;
      if (!providerService) return;

      return await providerService.updateEsellerProfile(vendor);
    } catch (error) {
      console.error("[Engagement Event Error] Failed to process updateEsellerProfile:", error);
    }
  }

  /**
   * Fires OEM Complete Onboarding Event
   * @param {object} user - VendorAuth / decoded token object containing user details
   */
  async oemOnboardingComplete(user) {
    try {
      if (!user) return;

      const providerService = this.providerService;
      if (!providerService) return;

      const vendorObj = user.Vendor || user;
      const profileId = user.id;

      const firstName = vendorObj.first_name || user.first_name || "";
      const lastName = vendorObj.last_name || user.last_name || "";
      const email = user.email || vendorObj.email || "";
      const dialCode = user.dial_code || vendorObj.dial_code || "91";
      const phoneNum = user.phone || vendorObj.phone || vendorObj.number || user.contact_number || "";
      const fullPhone = phoneNum ? `+${String(dialCode).replace("+", "")}${phoneNum}` : "";

      const attributes = {
        "OEM Name": `${firstName} ${lastName}`.trim() || firstName,
        "OEM Email": email,
        "OEM Phone": fullPhone,
        "OEM Login Link": "",
      };

      return await providerService.trackEsellerEvent(profileId, "OEM Complete Onboarding", attributes);
    } catch (error) {
      console.error("[Engagement Event Error] Failed to process oemOnboardingComplete:", error);
    }
  }

  /**
   * Fires OEM Profile Complete-Stage 1 Event
   * @param {object} user - VendorAuth / decoded token object containing user details
   * @param {object} productInfo - Product details object containing product_id, product_name, slug, brand, category, etc.
   */
  async oemProfileCompleteStage1(user, productInfo = {}) {
    try {
      if (!user) return;

      const providerService = this.providerService;
      if (!providerService) return;

      const vendorObj = user.Vendor || user;
      const profileId = user.id || user.profile_id;

      const firstName = vendorObj.first_name || user.first_name || "";
      const lastName = vendorObj.last_name || user.last_name || "";
      const email = user.email || vendorObj.email || "";
      const dialCode = user.dial_code || vendorObj.dial_code || "91";
      const phoneNum = user.phone || vendorObj.phone || vendorObj.number || "";
      const fullPhone = phoneNum ? `+${String(dialCode).replace("+", "")}${phoneNum}` : "";

      const attributes = {
        "Vendor Name": `${firstName} ${lastName}`.trim(),
        "Vendor Email": email,
        "Phone Number": fullPhone,
        "Product Id": productInfo.product_id || productInfo.id || "",
        "Product Name": productInfo.product_name || "",
        "Product Slug": productInfo.slug || productInfo.product_slug || "",
        "Brand Id": productInfo.brand_id || productInfo.Brand?.brand_id || "",
        "Brand Name": productInfo.brand_name || productInfo.Brand?.brand_name || "",
        "Brand Slug": productInfo.brand_slug || productInfo.Brand?.slug || "",
        "Category Id": productInfo.category_id || productInfo.Category?.category_id || "",
        "Category Name": productInfo.category_name || productInfo.Category?.category_name || "",
        "Category Slug": productInfo.category_slug || productInfo.Category?.slug || "",
        "Vendor Login Link": "",
        "Vendor Login Slug": "",
      };

      return await providerService.trackEsellerEvent(profileId, "OEM Profile Complete-Stage 1", attributes);
    } catch (error) {
      console.error("[Engagement Event Error] Failed to process oemProfileCompleteStage1:", error);
    }
  }
}

export default new EngagementEvent();

