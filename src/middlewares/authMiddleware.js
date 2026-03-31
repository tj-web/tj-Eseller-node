import redis from "../db/redisService.js";

export const authenticate = async (req, res, next) => {
  const sessionId = req.cookies.session_token;

  if (!sessionId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const sessionData = await redis.get(`ci_session:${sessionId}`);

  if (!sessionData) {
    return res.status(401).json({ message: "Session expired" });
  }

  const parsed = JSON.parse(sessionData);

  req.user = parsed;

  next();
};