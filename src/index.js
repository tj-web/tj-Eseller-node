import { configDotenv } from "dotenv";
configDotenv();
import { decodeTokenMiddleware } from "../src/middlewares/middleware.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import sequelize from "./db/connection.js";
import { AWS_paths } from "./config/constants.js";
import orderRoutes from "./routes/orders.routes.js";
import brandRoutes from "./routes/brands.routes.js";
import morgan from "morgan";
import dashboardRoutes from "./routes/dashboard.routes.js";
import manageLeads from "./routes/manageLeads.routes.js";
import manageProduct from "./routes/manageProduct.routes.js"
global.CONSTANTS = AWS_paths();

const app = express();
import { s3 } from "./config/aws.config.js";

app.get("/", (req, res) => {
  // console.log(CONSTANTS);
  return res.status(200).send(`test`);
});

app.use(cors());
const PORT = process.env.BASE_PORT;
app.use(morgan("dev"));

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


//dasboard routes
app.use(process.env.API_VERSION_PATH + "/dashboard", dashboardRoutes);

//ManageLeads Routes
app.use(process.env.API_VERSION_PATH + "/manage", manageLeads);
//manage product routes.
app.use( process.env.API_VERSION_PATH +"/product",manageProduct);


//manage orders routes
app.use(process.env.API_VERSION_PATH + "/orders", orderRoutes);

//manage brands routes 
app.use(process.env.API_VERSION_PATH + "/brands", brandRoutes);

app.listen(PORT, () => {
  console.log(`app is listening on the port ${PORT}`);
});
