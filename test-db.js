import sequelize from "./src/db/connection.js";
import Setting from "./src/models/websiteSetting.js"; // IMPORT YOUR SCHEMA HERE so Sequelize knows it exists
import Product from "./src/models/product.js";
import {getSelectedColumns} from "./src/models/ManageProduct/addBasicDetails.js"; // Adjust path to your helper

async function test() {
  try {
    // 1. Authenticate connection
    await sequelize.authenticate();
    console.log("✅ Database connected.");

    // 2. Test the function exactly as it appears in your controller
    const maxSlug = await getSelectedColumns(
      "tbl_product",
      ["product_name"],
      { product_code: "PE04" }
      
    );

    console.log("Result:", maxSlug);
    
    if (maxSlug) {
      console.log("✅ Test Passed! Value is:", maxSlug.product_name);
    } else {
      console.log("❌ Test Failed: No record found with var_name: 'MAX_SLUG_ID'");
    }

  } catch (error) {
    console.error("🛑 Error during test:", error);
  } finally {
    await sequelize.close();
  }
}

test();