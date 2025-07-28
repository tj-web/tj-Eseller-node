import { configDotenv } from "dotenv";
configDotenv();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import sequelize from "./db/connection.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
const app = express();



app.use(cors());
const PORT = 3000;

//cors enable
app.use(
  cors({
    origin: "http://localhost:5000",
    credentials: true, // if you're sending cookies or authorization headers
  })
);

app.use(express.urlencoded({ extended: true }));

// Database connection
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

//routes for the authentication
app.use("/api/auth", authRoutes);
app.use("/api/v6/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.send("lets learn something from the scratch");
});

app.listen(PORT, () => {
  console.log(`app is listening on the port ${PORT}`);
});
