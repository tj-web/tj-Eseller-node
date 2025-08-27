import { get_brand_by_id } from "../models/brand.model.js";
import { uploadFile } from "../config/aws.config.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { objectKeyDiff } from "../General_Function/general_helper.js";
import sequelize from "../db/connection.js";
// import { AWS_paths } from "../config/constants.js";
// global.CONSTANTS = AWS_paths();

// /********************HANDLE IMAGE UPLOADS********************** */


/********************CLEAN UPLOAD FILE NAME VALIDATOR************* */
function cleanUploadFileName(input) {
  return input.replace(/[^a-zA-Z0-9._]+/g, "");
}



/********************8save brand image utility. */
export const saveBrandImage = async (imageName, brand_id) => {
  try {
    let fileName;
    let awsObjectUrl = "";
    
    if (imageName) {
      
      const file = imageName;

      const filePath = `${CONSTANTS.AWS_BRAND_IMAGES}${brand_id}_`;
      fileName = `${brand_id}_${file.originalname}`;

      // upload file to S3
      const params = {
        Key: `${filePath}${file.originalname}`, // path inside bucket
        Body: file.buffer, // multer gives buffer
        ContentType: file.mimetype,
      };

      const uploadResult = await uploadFile(params);
      awsObjectUrl = uploadResult.Location; // same as $aws_object_url
    } else {
      // If no new file uploaded, keep old one
      fileName = req.body.old_image;
    }

    // update DB record
    const query = `
      UPDATE tbl_brand 
      SET image = :image 
      WHERE brand_id = :brand_id
    `;

    await sequelize.query(query, {
      replacements: { image: fileName, brand_id },
      type: sequelize.QueryTypes.UPDATE,
    });

    return awsObjectUrl;
  } catch (error) {
    console.error("Error in saveBrandImage:", error);
    throw error;
  }
};

