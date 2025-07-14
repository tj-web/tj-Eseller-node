import { Sequelize } from "sequelize";
import { configDotenv } from "dotenv";

// Load .env variables
configDotenv();

// Debug: print values to ensure they are loaded
console.log("DB:", process.env.MYSQL_DB);
console.log("USER:", process.env.MYSQL_USER);
console.log("PASSWORD:", process.env.MYSQL_PASSWORD);
console.log("HOST:", process.env.MYSQL_HOST);
console.log("DIALECT:", process.env.MYSQL_DIALECT);

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.MYSQL_DB,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    dialect: process.env.MYSQL_DIALECT,
    logging: false,
  }
);

// Authenticate
sequelize
  .authenticate()
  .then(() => console.log(" Connected to MySQL database"))
  .catch((err) =>
    console.error(" Error while connecting to MySQL database:", err)
  );

export default sequelize;
