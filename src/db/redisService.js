import { createClient } from 'redis';

const redis = createClient({
  socket: {
    host: '127.0.0.1',
    port: 6379,
  }
});

redis.on('error', (err) => console.error(' Redis Client Error:', err));

await redis.connect();

const pong = await redis.ping();
console.log(' Redis Ping Response:', pong); 

export default redis;
