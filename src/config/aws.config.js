// config/awsClient.js
import { S3Client,PutObjectCommand } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET,
  },
});

export const uploadFile = async ({Key, Body, ContentType}) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key,
      Body,
      ContentType,
      ACL: "public-read",
    });

    await s3.send(command);

    const fileUrl = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com${Key}`;
    console.log("File uploaded:", fileUrl);
    return fileUrl;
  } catch (error) {
    console.error(" Upload failed:", error);
    throw error;
  }
};
