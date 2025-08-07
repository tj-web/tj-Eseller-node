export const AWS_paths =()=>{
    //Base URL
 const AWS_PATH = process.env.AWS_PATH;
    const AWS_PATH_WEB = `${AWS_PATH}/web`
 /* upload and fetch path of eseller and web and manage */
    const AWS_FETCH_PRODUCT_IMAGES = `${AWS_PATH_WEB}/assets/images/techjockey/products/`;
    const DIR_FS_PRODUCT_NOIMAGE = `${AWS_PATH}/assets/images/techjockey/no-image.png`;
    return {
        AWS_PATH,
        AWS_PATH_WEB,
        AWS_FETCH_PRODUCT_IMAGES,
        DIR_FS_PRODUCT_NOIMAGE
    }
}