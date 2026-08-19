import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "auto",
  endpoint: "https://storage.googleapis.com",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_KEY, // GCS HMAC access ID
    secretAccessKey: process.env.AWS_SECRET, // GCS HMAC secret
  },
});

export const uploadFileToS3 = async function (fileObj) {
  if (!fileObj.key) {
    throw new Error("S3 key is required");
  }

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: fileObj.key,
    Body: fileObj.buffer,
    ...(fileObj.mimetype && { ContentType: fileObj.mimetype }),
  });

  await s3.send(command);

  return getUrl(fileObj.key);
};

export function getUrl(key) {
  return `${process.env.AWS_PATH}${key}`;
}

export async function download(key) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: key,
  });

  return await s3.send(command);
}
