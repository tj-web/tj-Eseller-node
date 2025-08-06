import { configDotenv } from "dotenv";
configDotenv();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import sequelize from "./db/connection.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
const app = express();
import morgan from 'morgan'
import { manageLeads } from "./controllers/manageLeadsController.js";

app.get("/", (req,res)=>{
  return res.status(200).send(`${Math.floor(Date.now()/1000)}`);
})


app.use(cors());
const PORT = 3000;
app.use(morgan('dev'));


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
app.use("/api/v6/manage",manageLeads)


app.listen(PORT,()=>{
  console.log(`app is listening on the port ${PORT}`)
})
