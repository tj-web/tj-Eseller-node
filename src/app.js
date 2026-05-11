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
import agreementRoutes from "./modules/agreement/agreement.routes.js";
import helpSupportRoutes from "./modules/helpSupport/helpSupport.routes.js";
import companyInformationRoutes from "./modules/companyInfo/companyInformation.routes.js";
import accountHealthRoutes from "./modules/accountHealth/accountHealth.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import leadsRoutes from "./modules/lead/manageLeads.routes.js";
import salesRoutes from "./modules/sales/sales.route.js";
import apiIntegrationRoutes from "./modules/apiintegration/apiintegration.route.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { authenticate } from "./middlewares/authMiddleware.js";
import { vendorModeMiddleware } from "./middlewares/vendorModeMiddleware.js";

global.CONSTANTS = AWS_paths();

const app = express();

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:5001"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).send("Eseller API is running.");
});

app.get("/health", function (req, res) {
  res.send("Ok");
});

const API_PREFIX = process.env.API_VERSION_PATH;

// Apply authenticate and vendorModeMiddleware to protected routes
app.use(`${API_PREFIX}/dashboard`, authenticate, vendorModeMiddleware, dashboardRoutes);
app.use(`${API_PREFIX}/lead`, authenticate, vendorModeMiddleware, manageLeads);
app.use(`${API_PREFIX}/orders`, authenticate, vendorModeMiddleware, orderRoutes);
app.use(`${API_PREFIX}/brands`, authenticate, vendorModeMiddleware, brandRoutes);
app.use(`${API_PREFIX}/product`, authenticate, vendorModeMiddleware, manageProduct);
app.use(`${API_PREFIX}/help-support`, authenticate, vendorModeMiddleware, helpSupportRoutes);
app.use(`${API_PREFIX}/company-information`, authenticate, vendorModeMiddleware, companyInformationRoutes);
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/leads`, authenticate, vendorModeMiddleware, leadsRoutes);
app.use(`${API_PREFIX}/sales`, authenticate, vendorModeMiddleware, salesRoutes);
app.use(`${API_PREFIX}/apiintegration`, authenticate, vendorModeMiddleware, apiIntegrationRoutes);

// do not apply authenticate in authRoutes here , it should be done
// in specific routes inside route folder

app.use(`${API_PREFIX}/eseller-agreement`, authenticate, vendorModeMiddleware, agreementRoutes);
app.use(`${API_PREFIX}/account-health`, authenticate, vendorModeMiddleware, accountHealthRoutes);

app.use(errorHandler);

export default app;
