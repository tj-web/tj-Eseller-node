import { createClient } from 'redis';
 
const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  }
});
 
redis.on('error', (err) => console.error(' Redis Client Error:', err));
 
await redis.connect();
 
const pong = await redis.ping();
const value = await redis.get("ci_session:411b1d987eebc083b0a5a4be42f14263bb25243a");
console.log("Redis Value:", value);
console.log(' Redis Ping Response:', pong);
 
export default redis;