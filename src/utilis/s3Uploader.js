import AWS from "aws-sdk";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  region: process.env.AWS_REGION,
});

export const uploadfile2 = async function (fileObj) {
 if (!fileObj.key) {
    throw new Error("S3 key is required");
  }

  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: fileObj.key, // Use the provided key
    Body: fileObj.buffer,
    ContentType: fileObj.mimetype,
    ACL: "public-read",
  };

  // Upload to S3
  // const awsResponse = await s3.upload(params).promise();

  // // Use AWS_PATH from .env
  // const fileUrl = `${process.env.AWS_PATH}${fileName}`;
  // return awsResponse?.Location ?? "";
    const awsResponse = await s3.upload(params).promise();
  return awsResponse.Location; 
};
