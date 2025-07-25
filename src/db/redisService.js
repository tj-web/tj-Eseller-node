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
console.log(' Redis Ping Response:', pong);
 
export default redis;