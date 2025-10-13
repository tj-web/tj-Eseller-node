import { createClient } from "redis";

const redis = createClient({
  socket: {
    host: "127.0.0.1",
    port: 6379,
  },
});

redis.on("error", (err) => console.error("Redis Client Error:", err));
await redis.connect();
console.log("redis connected successfully")

// Function to set JSON data
export async function setJson(key, value) {
  const jsonData = JSON.stringify(value);
  await redis.set(key, jsonData);
  console.log(` Saved ${key}`);
}

// Function to get JSON data
export async function getJson(key) {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

// Example usage
// await setJson("user:1001", { name: "Alice", age: 25, email: "alice@example.com" });

// const user = await getJson("user:1001");
// console.log(user); 

export default redis 