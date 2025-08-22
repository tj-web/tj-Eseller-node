import { get_brand_by_id } from "../models/brand.model.js";
import { s3 } from "../config/awsClient.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { objectKeyDiff } from "../General_Function/general_helper.js";

// /********************HANDLE IMAGE UPLOADS********************** */
// async function handleBrandImageUpload({ file, brandId, oldImage }) {
//   let imagePath;
//   if (file) {
//     const cleanName = cleanUploadFileName(file.originalname);

//     const filePath = `${process.env.AWS_BRAND_IMAGES}${brandId}_`;

//     // final key for S3 (like brands/123_logo.png)
//     const key = `${filePath}${cleanName}`;

//     // upload to S3
//     await s3.send(
//       new PutObjectCommand({
//         Bucket: process.env.AWS_BUCKET,
//         Key: key,
//         Body: file.buffer, // from multer.memoryStorage()
//         ContentType: file.mimetype,
//       })
//     );

//     // final path to store in DB (same as `$imagePath`)
//     imagePath = `${brandId}_${cleanName}`;
//   } else {
//     // no file uploaded → fallback
//     imagePath = oldImage;
//   }

//   return imagePath;
// }

/********************CLEAN UPLOAD FILE NAME VALIDATOR************* */
function cleanUploadFileName(input) {
  return input.replace(/[^a-zA-Z0-9._]+/g, "");
}

/************************ADD BRAND METHOD************************ */
export async function add_brand(post) {
  let data = {
    current_page: "brand_details",
    active_tab: "add_brand",
    brand_location: null,
  };
  if (brand_id) {
    const brand_details = get_brand_by_id(vendor_id, brand_id);
    console.log(brand_details);return;
    if (!brand_details) return "BRAND NOT FOUND";

    data = {
      ...data,
      brand_id,
      brand_name: brand_details.brand_name,
      image: brand_details.image,
      information: brand_details.information,
      founded_on: brand_details.founded_on,
      founders: brand_details.founders,
      comapnay_size: brand_details.comapnay_size,
      location: brand_details.location,
      industry: brand_details.industry,
    };
    if (post["id"]) {
      if (req.files && req.files.image && req.files.image.name) {
        let filepath = AWS_BRAND_IMAGES + brand_id + "_";
        req.files.image.name = cleanUploadFileName(req.files.image.name); // same as PHP helper
        const s3_url = await s3Utils.uploadFileS3(req.files.image, filepath);
        var imagePath = brand_id + "_" + req.files.image.name;
      } else {
        var imagePath = old_image;
      }

      let brand_save = {
        brand_name: post["brand_name"],
        information: post["information"],
        founded_on: post["founded_on"],
        founders: post["founders"],
        company_size: post["company_size"],
        location: post["location"],
        industry: post["industry"],
        image: imagePath,
      };

      const tbl_brand_diff = objectKeyDiff(brand_save, brand_details);
      if (tbl_brand_diff && Object.keys(tbl_brand_diff).length > 0) {
        const update_arr = {
          tbl_brand: Object.fromEntries(
            Object.entries({
              brand_name: tbl_brand_diff.brand_name
                ? tbl_brand_diff.brand_name
                : "",
              brand_image: tbl_brand_diff.image ? tbl_brand_diff.image : "",
              p_key: "brand_id",
              update_id: id,
            }).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
          ),

          tbl_brand_info: Object.fromEntries(
            Object.entries({
              founded_on: tbl_brand_diff.founded_on
                ? tbl_brand_diff.founded_on
                : "",
              founders: tbl_brand_diff.founders ? tbl_brand_diff.founders : "",
              company_size: tbl_brand_diff.company_size
                ? tbl_brand_diff.company_size
                : "",
              location: tbl_brand_diff.location ? tbl_brand_diff.location : "",
              industry: tbl_brand_diff.industry ? tbl_brand_diff.industry : "",
              information: tbl_brand_diff.information
                ? tbl_brand_diff.information
                : "",
              p_key: "id",
              update_id: brand_detail.tbl_info_id,
            }).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
          ),
        };

        // do something with update_arr
      }
    }
  }
}
