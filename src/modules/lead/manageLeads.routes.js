import express from "express";
import {
    getLeads,
    getDemos,
    getLeadHistory,
    addRemarkReminder,
    leadStatusHandler,
    getLeadDetails,
    setFollowup,
    getLeadAcdHistory,
    acceptDemo,
    rescheduleDemo,
    scheduleCallback,
    getVendorContacts,
    getLeadInsights,
    unlockLeadInsights,
    unlockContact,
    getLeadLocations,
    getCompetiterInsights
} from "./manageLeads.controller.js";

const router = express.Router();

router.get("/get-leads", getLeads);
router.get("/get-lead-locations", getLeadLocations);
router.get("/get-demos", getDemos);
router.get("/get-lead-history", getLeadHistory);
router.post("/add-remark-reminder", addRemarkReminder);
router.post("/lead-status-handler", leadStatusHandler);
router.get("/get-lead-details", getLeadDetails);
router.post("/set-followup", setFollowup);
router.get("/get-lead-acd-history", getLeadAcdHistory);
router.post("/accept-demo", acceptDemo);
router.post("/reschedule-demo", rescheduleDemo);
router.post("/schedule-callback", scheduleCallback);
router.get("/get-vendor-contacts", getVendorContacts);
router.get("/get-lead-insights", getLeadInsights);
router.post("/unlock-lead-insights", unlockLeadInsights);
router.post("/show-contact-info", unlockContact);
router.get("/competiter-insights", getCompetiterInsights);

export default router;
