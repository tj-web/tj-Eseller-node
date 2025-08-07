import { configDotenv } from "dotenv";
configDotenv();
import {decodeTokenMiddleware} from '../src/middlewares/middleware.js'
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import sequelize from "./db/connection.js";
import { AWS_paths } from "./config/constants.js";
import orderRoutes from "./routes/orders.routes.js";
import brandRoutes from "./routes/brands.routes.js";
import morgan from "morgan";

global.CONSTANTS = AWS_paths();

const app = express();
import dashboardRoutes from "./routes/dashboard.routes.js";
import { manageLeads } from "./controllers/manageLeadsController.js";

app.get("/", (req, res) => {
  // console.log(CONSTANTS);
  return res.status(200).send(`test`);
});

app.use(cors());
const PORT = 3000;
app.use(morgan("dev"));

// morgan package
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5000",
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));

try {
  await sequelize.authenticate();
  console.log("Database connected successfully");
} catch (error) {
  console.error("Database connection failed:", error);
}

//cors related
app.use(express.json());
app.use(cookieParser());

// global error handling middleware
app.use((err, req, res, next) => {
  return res.status(500).json({ message: "Something went wrong" });
});

// Authentication routes
app.use("/api/auth", authRoutes);

//dasboard routes
app.use("/api/v6/dashboard", dashboardRoutes);

//ManageLeads Routes
app.use("/api/v6/manage", manageLeads);

//routes for the authentication
app.use("/api/auth", authRoutes);
app.use("/api/v6/orders", orderRoutes);
app.use("/api/v6/brand-list", brandRoutes);

app.listen(PORT, () => {
  console.log(`app is listening on the port ${PORT}`);
});

