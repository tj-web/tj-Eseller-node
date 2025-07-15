import { createClient } from "redis";

const redis = await createClient()
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

await redis.set("varun", "tirkha");
const value = await redis.get("varun");
console.log(value);
// client.destroy();

export default redis;
