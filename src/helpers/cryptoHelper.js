import crypto from "crypto";

export const generateToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token , hash };
};

export const hashPassword = (password) => {
  return crypto.createHash("md5").update(password).digest("hex");
};

const getAesKey = () => {
  const secret = process.env.AES_SECRET_KEY;

  if (!secret) {
    throw new Error("AES_SECRET_KEY is missing in environment variables.");
  }

  return crypto.createHash("sha256").update(secret).digest();
};

export const encodeData = (data) => {
  const key = getAesKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ]);

  return encodeURIComponent(Buffer.concat([iv, encrypted]).toString("base64"));
};

