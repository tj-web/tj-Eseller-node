import express from "express";
import { 
    getLeadsController, 
    getDemosController, 
    getLeadHistoryController, 
    addRemarkReminderController,
    leadStatusHandlerController,
    getLeadDetailsController,
    setFollowupController,
    getLeadAcdHistoryController,
    acceptDemoController,
    rescheduleDemoController,
    scheduleCallbackController,
    getVendorContactsController,
    getLeadInsightsController,
    unlockLeadInsightsController,
    unlockContactController
} from "./manageLeads.controller.js";

const router = express.Router();

router.get("/get-leads", getLeadsController);
router.get("/get-demos", getDemosController);
router.get("/get-lead-history", getLeadHistoryController);
router.post("/add-remark-reminder", addRemarkReminderController);
router.post("/lead-status-handler", leadStatusHandlerController);
router.get("/get-lead-details", getLeadDetailsController);
router.post("/set-followup", setFollowupController);
router.get("/get-lead-acd-history", getLeadAcdHistoryController);
router.post("/accept-demo", acceptDemoController);
router.post("/reschedule-demo", rescheduleDemoController);
router.post("/schedule-callback", scheduleCallbackController);
router.get("/get-vendor-contacts", getVendorContactsController);
router.get("/get-lead-insights", getLeadInsightsController);
router.post("/unlock-lead-insights", unlockLeadInsightsController);
router.post("/unlock-contact", unlockContactController);

export default router;
