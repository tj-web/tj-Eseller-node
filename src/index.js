import { configDotenv } from "dotenv";
configDotenv();
import express from "express";
import sequelize from "./db/connection.js";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  return res.send("Hello, world!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
