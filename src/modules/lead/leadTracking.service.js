import mongoose from "mongoose";

/**
 * Perform raw tracking data insert into MongoDB.
 */
export const dumpTrackingData = async (data) => {
    try {
        const db = mongoose.connection.db;
        const tracksCollection = db.collection('tracks');
        await tracksCollection.insertOne({
            ...data,
            created_at: new Date()
        });
        return true;
    } catch (error) {
        console.error("Tracking Dump Error:", error);
        return false;
    }
};
