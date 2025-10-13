// middleware/isAuthenticated.js
import jwt from "jsonwebtoken";


export const isAuthenticated = (req, res, next) => {
  try {
    const token =
      req.cookies?.authToken || 
      req.headers["authorization"]?.split(" ")[1]; // bearer token method

    // console.log("Token extracted:", token);

    if (!token) {
      console.log("No token found in cookies or headers");
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT payload:", decoded);

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
