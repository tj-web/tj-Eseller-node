import sequelize from "./db/connection.js";

import { vendorOrders } from "../src/utilis/orders.utility.js"

async function testVendorOrders() {
  try {
    // 1. DB Connection check
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.\n");

    // Test input
    const TEST_VENDOR_ID = 942;

    const params = {
      page: 1,
      limit: 10,
      status: 5, // try "", 1, 5
    };

    console.log(`▶️ Testing vendorOrders(${TEST_VENDOR_ID})...\n`);

    // 2. Call function
    const result = await vendorOrders({
      vendor_id: TEST_VENDOR_ID,
      params,
    });

    // 3. Print result
    console.log("✅ Success! Processed Orders:\n");
    console.dir(result, { depth: null, colors: true });

    // 4. Extra validation logs
    const orderCount = Object.keys(result.orders || {}).length;
    console.log(`\n📦 Total Orders Returned: ${orderCount}`);

    if (orderCount > 0) {
      const firstOrder = Object.values(result.orders)[0];
      console.log("\n🔍 Sample Order:");
      console.dir(firstOrder, { depth: null, colors: true });
    }

    console.log("\n🎉 vendorOrders test completed successfully!");
  } catch (error) {
    console.error("\n🛑 Error during vendorOrders test:", error);
  } finally {
    await sequelize.close();
  }
}

testVendorOrders();