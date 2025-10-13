
import jwt from "jsonwebtoken";

/**
 * Generates a JWT token for any payload
 * @param {Object} payload - Object with any data
 * @returns {string} Signed JWT token
 */
export function generateToken(payload) {
  const secretKey = process.env.JWT_SECRET || "mydefaultsecret";

  return jwt.sign(payload, secretKey, { expiresIn: "24h" });
}
