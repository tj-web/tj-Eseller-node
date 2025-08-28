// import { configDotenv,dotenv } from "dotenv";
// configDotenv();
// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import sequelize from "./db/connection.js";
// import { AWS_paths } from "./config/constants.js";
// import orderRoutes from "./routes/orders.routes.js";
// import brandRoutes from "./routes/brands.routes.js";
// import morgan from "morgan";
// import dashboardRoutes from "./routes/dashboard.routes.js";
// import manageLeads from "./routes/manageLeads.routes.js";
// import manageProduct from "./routes/manageProduct.routes.js"

// global.CONSTANTS = AWS_paths();

// const app = express();
// app.get("/", (req, res) => {
//   return res.status(200).send(`test`);
// });
// dotenv.config({
//   debug: false,  
// });

// app.use(cors());
// const PORT = process.env.BASE_PORT;
// app.use(morgan("dev"));

// app.use(express.json());

// app.use(
//   cors({
//     origin: "http://localhost:5000",
//     credentials: true,
//   })
// );

// app.use(express.urlencoded({ extended: true }));

// try {
//   await sequelize.authenticate();
//   console.log("Database connected successfully");
// } catch (error) {
//   console.error("Database connection failed:", error);
// }


// //cors related
// app.use(express.json());
// app.use(cookieParser());

// // global error handling middleware
// app.use((err, req, res, next) => {
//   return res.status(500).json({ message: "Something went wrong" });
// });


// //dasboard routes
// app.use(process.env.API_VERSION_PATH + "/dashboard", dashboardRoutes);

// //ManageLeads Routes
// app.use(process.env.API_VERSION_PATH + "/manage", manageLeads);

// //routes for the authentication 
// app.use(process.env.API_VERSION_PATH + "/orders", orderRoutes)
// app.use(process.env.API_VERSION_PATH + "/brands", brandRoutes)
// app.use( process.env.API_VERSION_PATH +"/product",manageProduct)

// app.listen(PORT, () => {
//   console.log(`app is listening on the port ${PORT}`);
// });


import dotenv from "dotenv";
dotenv.config({ debug: false }); 

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import sequelize from "./db/connection.js";
import { AWS_paths } from "./config/constants.js";
import orderRoutes from "./routes/orders.routes.js";
import brandRoutes from "./routes/brands.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import manageLeads from "./routes/manageLeads.routes.js";
import manageProduct from "./routes/manageProduct.routes.js";
import morgan from "morgan";

// Global constants
global.CONSTANTS = AWS_paths();

const app = express();

// Middlewares
app.use(cors({
  origin: "http://localhost:5000",
  credentials: true,
}));
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

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  return res.status(500).json({ message: "Something went wrong" });
});

// Start server
const PORT = process.env.BASE_PORT || 3000;
app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});
