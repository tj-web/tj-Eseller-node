import sequelize from "./db/connection.js";
import app from "./app.js";
import dotenv from "dotenv";
import connectMongo from "./db/mongo.js";
dotenv.config({ debug: false });

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

const startServer = async () => {
  await connectDB();
  await connectMongo();

  const PORT = process.env.BASE_PORT || 5002;

  app.listen(PORT, () => {
    console.log(`App is listening on port ${PORT}`);
  });
};

startServer();

// Restart trigger