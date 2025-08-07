import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes from "./routes/auth.routes.js";
import sequelize from './db/connection.js';
import {AWS_paths} from './config/constants.js'
import orderRoutes from './routes/orders.routes.js'
import brandRoutes from './routes/brands.routes.js'
import morgan from 'morgan'

global.CONSTANTS = AWS_paths();

const app = express()


app.get("/", (req,res)=>{
  // console.log(CONSTANTS);
  return res.status(200).send(`test`);
})


app.use(cors())
const PORT=3000;

// morgan package 
app.use(morgan('dev'));
app.use(express.json())



//cors enable 
app.use(cors({
  origin: 'http://localhost:5000',
  credentials: true, // if you're sending cookies or authorization headers
}));

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
app.use((err,req,res,next)=>{
  return res.status(500).json({message:"Something went wrong"});
});



//routes for the authentication 
app.use("/api/auth", authRoutes); 
app.use("/api/v6/orders", orderRoutes)
app.use("/api/v6/brand-list", brandRoutes)


app.listen(PORT,()=>{
  console.log(`app is listening on the port ${PORT}`)
})
