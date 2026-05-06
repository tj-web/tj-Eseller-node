import express from "express";
import {
  getHealthScore,
  getReviews,
  getProfileCompletion,
  getTrustedSeller,
  getAccountStatus,
  saveReviewReply,
  sendReviewEmail,
} from "./accountHealth.controller.js";

const router = express.Router();

router.get("/score", getHealthScore);
router.get("/reviews", getReviews);
router.get("/profile-completion", getProfileCompletion);
router.get("/trusted-seller", getTrustedSeller);
router.get("/account-status", getAccountStatus);
router.post("/reviews/reply", saveReviewReply);
router.post("/reviews/send-email", sendReviewEmail);

export default router;
