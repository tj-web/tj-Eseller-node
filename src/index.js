import dotenv from "dotenv";
dotenv.config({ debug: false });

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import sequelize from "./config/connection.js";
import { AWS_paths } from "./config/constants.js";
import orderRoutes from "./routes/orders.routes.js";
import brandRoutes from "./routes/brands.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import manageLeads from "./routes/manageLeads.routes.js";
import manageProduct from "./routes/manageProduct.routes.js";
import agreementRoutes from "./routes/agreement.routes.js";
import helpSupportRoutes from "./routes/help-support.routes.js";
import accountHealthRoutes from "./routes/accountHealth.routes.js";
import authRoutes from './routes/auth.routes.js'
import session from 'express-session'
import redis from "./config/redisService.js"

import morgan from "morgan";

// Global constants
global.CONSTANTS = AWS_paths();

const app = express();

// Middlewares
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  session({
    name: "myAppSessionId",   //  custom cookie name instead of connect.sid
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true }
  })
);

// Test route
app.get("/", (req, res) => {
  res.status(200).send("test");
});

// Routes
app.use(process.env.API_VERSION_PATH + "/dashboard", dashboardRoutes);
app.use(process.env.API_VERSION_PATH + "/manage", manageLeads);
app.use(process.env.API_VERSION_PATH + "/orders", orderRoutes);
app.use(process.env.API_VERSION_PATH + "/brands", brandRoutes);
app.use(process.env.API_VERSION_PATH + "/product", manageProduct);
app.use(process.env.API_VERSION_PATH + "/eseller-agreement", agreementRoutes);
app.use(process.env.API_VERSION_PATH + "/help-support", helpSupportRoutes);
app.use(process.env.API_VERSION_PATH + "/account", accountHealthRoutes);
app.use(process.env.API_VERSION_PATH + '/authenticate',authRoutes)

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong",
  });
});

// Start server
const PORT = process.env.BASE_PORT || 3000;
app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});
