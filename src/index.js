import dotenv from "dotenv";
dotenv.config({ debug: false });

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import sequelize from "./db/connection.js";
import { AWS_paths } from "./config/constants.js";
import orderRoutes from "./modules/order/orders.routes.js";
import brandRoutes from "./modules/brand/brands.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import manageLeads from "./modules/lead/manageLeads.routes.js";
import manageProduct from "./modules/product/product.route.js";
import agreementRoutes from "./routes/agreement.routes.js";
import helpSupportRoutes from "./routes/help-support.routes.js";
import companyInformationRoutes from "./modules/companyInfo/companyInformation.routes.js";
import accountHealthRoutes from "./modules/accountHealth/accountHealth.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { authenticate } from "./middlewares/authMiddleware.js";

import morgan from "morgan";

// Global constants
global.CONSTANTS = AWS_paths();

const app = express();

// Middlewares
app.use(
  cors({
    origin: ["http://localhost:5000", "http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Test route
app.get("/", (req, res) => {
  res.status(200).send("test");
});

// DB connection
try {
  await sequelize.authenticate();
  console.log("Database connected successfully");
} catch (error) {
  console.error("Database connection failed:", error);
}

// Routes
app.use(process.env.API_VERSION_PATH + "/dashboard", dashboardRoutes);
app.use(process.env.API_VERSION_PATH + "/manage", manageLeads);
app.use(process.env.API_VERSION_PATH + "/orders", orderRoutes);
app.use(process.env.API_VERSION_PATH + "/brands", brandRoutes);
app.use(process.env.API_VERSION_PATH + "/product", manageProduct);
app.use(
  process.env.API_VERSION_PATH + "/eseller-agreement",
  authenticate,
  agreementRoutes,
);
app.use(process.env.API_VERSION_PATH + "/help-support", helpSupportRoutes);
app.use(
  process.env.API_VERSION_PATH + "/company-information",
  companyInformationRoutes,
);
app.use(
  process.env.API_VERSION_PATH + "/account-health",
  authenticate,
  accountHealthRoutes,
);
app.use(process.env.API_VERSION_PATH + "/auth", authRoutes);

// Global error handler
// app.use((err, req, res, next) => {
//   console.error("Global error:", err);
//   return res.status(500).json({ message: "Something went wrong" });
// });

app.use(errorHandler);

// Start server
const PORT = process.env.BASE_PORT || 3000;
app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});
