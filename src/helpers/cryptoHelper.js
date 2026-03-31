import crypto from "crypto";

export const generateToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token , hash };
};

export const hashPassword = (password) => {
  return crypto.createHash("md5").update(password).digest("hex");
};