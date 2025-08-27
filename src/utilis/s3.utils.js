// s3Service.js
import { S3Client, CreateBucketCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

// Create S3 Client
import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.AWS_REGION, 
  credentials: {
    accessKeyId: process.env.AWS_KEY,     
    secretAccessKey: process.env.AWS_SECRET, 
  },
});

// Create Bucket
export async function addBucket(bucketName) {
  try {
    const result = await s3.send(
      new CreateBucketCommand({
        Bucket: bucketName,
        CreateBucketConfiguration: { LocationConstraint: process.env.AWS_REGION }
      })
    );
    return result;
  } catch (err) {
    console.error("Error creating bucket:", err);
    throw err;
  }
}

// Upload File to S3
export async function uploadFileS3(file, filepath = "") {
  try {
    const fileStream = fs.createReadStream(file.path); // 'file.path' comes from multer or similar
    const key = filepath + file.originalname;

    const result = await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: key,
        Body: fileStream,
        ContentType: file.mimetype || "application/octet-stream",
        StorageClass: "STANDARD",
        ACL: "public-read"
      })
    );

    // Return public URL (if bucket is public)
    return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (err) {
    console.error("Error uploading file:", err);
    throw err;
  }
}

// Check if File Exists in S3
export async function fileExistsS3(filename) {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: filename
      })
    );
    return true; // exists
  } catch (err) {
    if (err.name === "NotFound") return false;
    throw err;
  }
}
