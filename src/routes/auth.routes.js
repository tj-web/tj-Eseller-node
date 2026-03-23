import express from "express";
import { login , signup , forgotPassword , logOut ,logOutAllSessions , resetPassword ,changePassword} from "../controllers/auth.controller.js";

const router = express.Router();


router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logOut);
router.post("/logout-all-sessions", logOutAllSessions);
router.post("/forgot-password", forgotPassword) 
// **************************************************************************
router.post("/reset-password", resetPassword) // this should not be bound with login ,
// this route is to reset password when the user forgets it , 
// it will open in his mail and should be public !!
router.post("/change-password", changePassword) // some changes are still required  !!!
export default router;