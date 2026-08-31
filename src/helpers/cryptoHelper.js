import crypto from "crypto";

export const generateToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token , hash };
};

export const hashPassword = (password) => {
  return crypto.createHash("md5").update(password).digest("hex");
};

export const encodeData = (data) => {
  const key = Buffer.from("9sqrEgP2JlbAijGZMH1fssfx0Lc9744Y").slice(0, 16);
  const iv = Buffer.from("9sqrEgP2JlbAijGZ");
  const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "base64");
  encrypted += cipher.final("base64");
  return encodeURIComponent(encrypted);
};