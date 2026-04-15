import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
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

// Global constants
global.CONSTANTS = AWS_paths();

const app = express();

// --- Middlewares ---
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

// --- Test Route ---
app.get("/", (req, res) => {
  res.status(200).send("Eseller API is running.");
});

// --- API Routes ---
const API_PREFIX = process.env.API_VERSION_PATH || "/api/v1";

app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/manage`, manageLeads);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/brands`, brandRoutes);
app.use(`${API_PREFIX}/product`, manageProduct);
app.use(`${API_PREFIX}/help-support`, helpSupportRoutes);
app.use(`${API_PREFIX}/company-information`, companyInformationRoutes);
app.use(`${API_PREFIX}/auth`, authRoutes);

// Protected Routes
app.use(`${API_PREFIX}/eseller-agreement`, authenticate, agreementRoutes);
app.use(`${API_PREFIX}/account-health`, authenticate, accountHealthRoutes);

// --- Global Error Handler ---
app.use(errorHandler);

export default app;