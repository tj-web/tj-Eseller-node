import { configDotenv } from "dotenv";
configDotenv();
import express from "express";
import sequelize from "./db/connection.js";
const app = express();
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes from "./routes/auth.routes.js";



app.use(cors())
const PORT=3000;


//cors related 
app.use(express.json());
app.use(cookieParser());

// global error handling middleware
app.use((err,req,res,next)=>{
  return res.status(500).json({message:"Something went wrong"});
});


//routes for the authentication 
app.use("/api/auth", authRoutes); 


app.get('/',(req,res)=>{
  res.send("lets learn something from the scratch")
})

app.listen(PORT,()=>{
  console.log(`app is listening on the port ${PORT}`)
})
