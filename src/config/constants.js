import { v4 as uuidv4 } from "uuid";
export const AWS_paths = () => {
  //Base URL
  const AWS_PATH = process.env.AWS_PATH;
  const AWS_PATH_WEB = `${AWS_PATH}web`;
    const AWS_UPLOAD_WEB = "/web";
    const AWS_BRAND_IMAGES = `${AWS_UPLOAD_WEB}/assets/images/techjockey/brands/}`
  /* upload and fetch path of eseller and web and manage */
  const AWS_FETCH_PRODUCT_IMAGES = `${AWS_PATH_WEB}/assets/images/techjockey/products/`;
  const DIR_FS_PRODUCT_NOIMAGE = `${AWS_PATH}assets/images/techjockey/no-image.png`;
  return {
    AWS_PATH,
    AWS_PATH_WEB,
    AWS_FETCH_PRODUCT_IMAGES,
    DIR_FS_PRODUCT_NOIMAGE,
    AWS_BRAND_IMAGES,
  };
};

export const EMAIL_DLQ_NAME = "email.dlx";

export const EMAIL_QUEUE_PRIORITY = {
  NORMAL: { routingKey: "email.normal", priority: "normal" },
  HIGH: { routingKey: "email.high", priority: "high" },
  LOW: { routingKey: "email.low", priority: "low" },
};

export const generateMessageId = () => uuidv4();
