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

    Key: `web/assets/images/techjockey/brands/${fileObj.originalname}`, 

    Body: fileObj.buffer,
    ContentType: fileObj.mimetype,
    ACL: "public-read",
  };

  
  const awsResponse = await s3.upload(params).promise();

  
  const fileUrl = `${process.env.AWS_PATH}${fileObj.originalname}`;
  return awsResponse?.Location ?? "";
};
