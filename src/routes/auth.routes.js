import express from "express";
import { auth_oem,login_oem,resetpassword } from "../controllers/auth.controller.js";
import { validInput,emailValidate } from "../middlewares/authValidation.js";
import {isAuthenticated} from '../middlewares/isAuthenticated.js'
const router = express.Router();

router.post('/authen_oem',validInput,isAuthenticated, auth_oem)
router.post('/login',emailValidate,login_oem)
router.post('/forgetpassword',resetpassword)



export default router;