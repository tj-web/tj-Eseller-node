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
import { errorHandler } from "./middlewares/errorHandler.js";
import { authenticate } from "./middlewares/authMiddleware.js";

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

app.use(`${API_PREFIX}/dashboard`, authenticate, dashboardRoutes);
app.use(`${API_PREFIX}/lead`, authenticate, manageLeads);
app.use(`${API_PREFIX}/orders`, authenticate, orderRoutes);
app.use(`${API_PREFIX}/brands`, authenticate, brandRoutes);
app.use(`${API_PREFIX}/product`, authenticate, manageProduct);
app.use(`${API_PREFIX}/help-support`, authenticate, helpSupportRoutes);
app.use(`${API_PREFIX}/company-information`, authenticate, companyInformationRoutes);
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/leads`, leadsRoutes);
app.use(`${API_PREFIX}/sales`, authenticate, salesRoutes);

// do not apply authenticate in authRoutes here , it should be done
// in specific routes inside route folder

app.use(`${API_PREFIX}/eseller-agreement`, agreementRoutes);
app.use(`${API_PREFIX}/account-health`, accountHealthRoutes);

app.use(errorHandler);

export default app;
