import mongoose from "mongoose";
import { configDotenv } from "dotenv";

configDotenv();

const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to MongoDB database");
    } catch (err) {
        console.error("Error while connecting to MongoDB database. Error:", err);
    }
};

export default connectMongo;
