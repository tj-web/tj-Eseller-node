import { Sequelize } from "sequelize";
import sequelize from "../db/connection.js";
export async function get_vendor_brands({vendor_id,  orderby, order, srch_brand_name, srch_status, limit = 10   , pagenumber = 1}) {
    let whereCondition = '';
    let offset = (pagenumber-1)*limit;
    // whereCondition = `vbr.vendor_id = ${vendor_id} AND vbr.tbl_brand_id != 0`;
    switch (orderby) {
        case "s_id" :
            orderby = "tb.id";
            
            break;
        case "s_brand_name" :
            orderby = "tb.brand_name";
            
            break;
        case "s_status" :
            orderby = "vbr.status";
            
            break;
        default:
            orderby = "tb.brand_id";
    }

    order=order|| 'desc';
    whereCondition = `vbr.vendor_id = :vendor_id AND vbr.tbl_brand_id != 0`;
    
    if(srch_brand_name)
        whereCondition += ` AND tb.brand_name LIKE :srch_brand_name`;
    
    if(srch_status)
        whereCondition += ` AND vbr.status = :srch_status`;
    


    const sql = `SELECT
    vbr.id,
    vbr.vendor_id,
    vbr.tbl_brand_id,
    vbr.status,
    tb.brand_name,
    tb.description,
    tb.image,
    tb.status AS brand_status
FROM
    vendor_brand_relation AS vbr
LEFT JOIN tbl_brand AS tb
ON
    tb.brand_id = vbr.tbl_brand_id
WHERE
    ${whereCondition}
ORDER BY :orderby :order

LIMIT :offset, :limit;`
    
    

    const results = await sequelize.query(sql, {
        replacements: {
            vendor_id,
            limit:+limit, 
            offset,
            orderby,
            order,
            srch_brand_name,
            srch_status
        },
        type: sequelize.QueryTypes.SELECT
    });

    return results;
}
