import sequelize from "../../db/connection.js";
import { Op, fn, col, literal, QueryTypes } from "sequelize";
import Vendors from "../../models/vendor.model.js";
import VendorParticularMatrix from "../../models/vendorParticularMatrix.model.js";
import VendorParticular from "../../models/vendorParticular.model.js";
import Review from "../../models/review.model.js";
import ReviewReplies from "../../models/reviewReplies.model.js";
import Product from "../../models/product.model.js";
import Brand from "../../models/brand.model.js";
import ProductImage from "../../models/productImage.model.js";
import VendorBrandRelation from "../../models/vendorBrandRelation.model.js";
import VendorsLeads from "../../models/vendorLead.model.js";
import VendorAnalytics from "../../models/vendorAnalytics.model.js";
import VendorDetail from "../../models/vendorDetail.model.js";
import VendorAuth from "../../models/vendorAuth.model.js";
import EmailQueue from "../../models/emailQueue.model.js";
import { AppError } from "../../utilis/appError.js";

// Define Associations
VendorParticularMatrix.belongsTo(VendorParticular, { foreignKey: "particular_id" });
VendorParticularMatrix.belongsTo(Brand, { foreignKey: "brand_id" });
VendorParticularMatrix.belongsTo(Product, { foreignKey: "product_id" });
Review.hasMany(ReviewReplies, { foreignKey: "review_id" });
ReviewReplies.belongsTo(VendorAuth, { foreignKey: "replied_by_profile_id" });
Review.belongsTo(Product, { foreignKey: "product_id" });
Product.hasMany(ProductImage, { foreignKey: "product_id" });

/* =========================================
   HELPERS
========================================= */

const getVendorProductIds = async (vendor_id) => {
  const brandRelations = await VendorBrandRelation.findAll({
    where: {
      vendor_id,
      status: 1,
    },
    attributes: ["tbl_brand_id"],
  });

  const brandIds = brandRelations.map((r) => r.tbl_brand_id);
  if (brandIds.length === 0) return [];

  const products = await Product.findAll({
    where: {
      brand_id: { [Op.in]: brandIds },
      is_deleted: 0,
      status: 1,
      show_status: 1,
    },
    attributes: ["product_id"],
    order: [["product_id", "ASC"]],
  });

  return products.map((p) => p.product_id);
};

/* =========================================
   ACCOUNT HEALTH CORE SERVICES
========================================= */

export const getHealthScoreService = async (vendor_id) => {
  try {
    const productIds = await getVendorProductIds(vendor_id);

    // 1. Profile Score from vendors table
    const vendor = await Vendors.findOne({
      where: { id: vendor_id },
      attributes: ["particular_score", "trusted_seller"],
    });

    if (!vendor) throw new AppError("Vendor not found", 404);

    const profile_score = Math.round(vendor.particular_score || 0);

    // 2. Incomplete Particulars
    const incompleteParticulars = await VendorParticularMatrix.findAll({
      where: {
        vendor_id,
        product_id: productIds.length > 0 ? productIds[0] : null,
        matrix_status: 0,
        status: 1,
      },
      include: [
        {
          model: VendorParticular,
          attributes: ["name"],
          required: true,
        },
      ],
    });

    // 3. Detailed Review Stats (Using avg_prod_rating_view via Raw Query)
    let summaryStats = {
      total_reviews: 0,
      avg_rating: 0,
      avg_ease_use_rating: 0,
      avg_value_money_rating: 0,
      avg_features_rating: 0,
      avg_support_rating: 0,
      avg_soft_recomm: 0,
    };

    if (productIds.length > 0) {
      const reviewsData = await sequelize.query(
        "SELECT * FROM avg_prod_rating_view WHERE product_id IN (:productIds)",
        {
          replacements: { productIds },
          type: QueryTypes.SELECT,
        }
      );

      if (reviewsData.length > 0) {
        let totalWeight = 0;
        let weightedRating = 0;
        let weightedEase = 0;
        let weightedValue = 0;
        let weightedFeatures = 0;
        let weightedSupport = 0;
        let weightedRecomm = 0;

        reviewsData.forEach((row) => {
          const count = parseInt(row.total_reviews) || 0;
          totalWeight += count;
          weightedRating += (parseFloat(row.rating_average) || 0) * count;
          weightedEase += (parseFloat(row.avg_ease_use_rating) || 0) * count;
          weightedValue += (parseFloat(row.avg_value_money_rating) || 0) * count;
          weightedFeatures += (parseFloat(row.avg_features_rating) || 0) * count;
          weightedSupport += (parseFloat(row.avg_support_rating) || 0) * count;
          weightedRecomm += (parseFloat(row.avg_soft_recomm) || 0) * count;
        });

        if (totalWeight > 0) {
          summaryStats = {
            total_reviews: totalWeight,
            avg_rating: weightedRating / totalWeight,
            avg_ease_use_rating: weightedEase / totalWeight,
            avg_value_money_rating: weightedValue / totalWeight,
            avg_features_rating: weightedFeatures / totalWeight,
            avg_support_rating: weightedSupport / totalWeight,
            avg_soft_recomm: weightedRecomm / totalWeight,
          };
        }
      }
    }

    // 4. Response Time (Aligned with PHP Source: VendorAnalytics)
    const analytics = await VendorAnalytics.findOne({
      where: { vendor_id },
      attributes: [
        [fn("SUM", col("total_attempt_time")), "total_time"],
        [fn("SUM", col("total_attempt_lead")), "total_leads"],
      ],
      raw: true,
    });

    let avg_response_time = 0;
    if (analytics && analytics.total_leads > 0) {
      avg_response_time = Math.round(analytics.total_time / analytics.total_leads);
    } else {
      // Fallback to real-time calculation if analytics table is empty
      const realtime = await VendorsLeads.findAll({
        where: { vendor_id },
        attributes: [
          [
            fn(
              "AVG",
              literal(
                "TIMESTAMPDIFF(HOUR, VendorsLeads.created_at, (SELECT MIN(created_at) FROM vendor_agent_remark_reminder WHERE item_id = VendorsLeads.lead_id AND item_type = 3))"
              )
            ),
            "avg_response_time",
          ],
        ],
        raw: true,
      });
      avg_response_time = Math.round(realtime[0]?.avg_response_time || 0);
    }

    // 5. Price Availability
    const is_price_available =
      (await Product.count({
        where: {
          product_id: { [Op.in]: productIds },
          price_on_request: 1,
        },
      })) === 0
        ? 1
        : 0;

    // 6. Calculate Health Score (0-3)
    let health_score = 0;
    if (profile_score >= 75) health_score++;
    if (summaryStats.total_reviews >= 10) health_score++;
    if (vendor.trusted_seller === 1) health_score++;

    return {
      profile_score,
      health_score,
      total_reviews: summaryStats.total_reviews,
      average_rating: parseFloat(summaryStats.avg_rating.toFixed(1)),
      sub_ratings: {
        ease_of_use: parseFloat(summaryStats.avg_ease_use_rating.toFixed(1)),
        value_for_money: parseFloat(summaryStats.avg_value_money_rating.toFixed(1)),
        features: parseFloat(summaryStats.avg_features_rating.toFixed(1)),
        customer_support: parseFloat(summaryStats.avg_support_rating.toFixed(1)),
        software_recommendation: parseFloat(summaryStats.avg_soft_recomm.toFixed(1)),
      },
      primary_product_id: productIds.length > 0 ? productIds[0] : null,
      incomplete_particulars: incompleteParticulars.map((p) => p.VendorParticular?.name),
      is_price_available,
      avg_response_time,
      is_trusted_seller: vendor.trusted_seller,
    };
  } catch (error) {
    throw error;
  }
};

export const getReviewsDataService = async (vendor_id, query) => {
  try {
    const { page = 1, limit = 10, sort_by = "latest_first", productName, rating, date } = query;
    const productIds = await getVendorProductIds(vendor_id);

    if (productIds.length === 0) {
      return { reviews: [], total: 0, overall_stats: null };
    }

    const whereClause = {
      product_id: { [Op.in]: productIds },
      status: 1,
      is_deleted: 0,
    };

    // Apply Search Filters
    if (rating) {
      const ratingFloor = Math.floor(rating);
      whereClause[Op.and] = [
        literal(
          `(ROUND(Review.rating) = ${ratingFloor} OR (Review.rating >= ${ratingFloor} AND Review.rating < ${ratingFloor + 1}))`
        ),
      ];
    }

    if (date) {
      whereClause.created_at = {
        [Op.gte]: new Date(date),
        [Op.lt]: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
      };
    }

    // 1. Fetch Overall Aggregates (Star Distribution + Sub-ratings)
    const starCounts = await Review.findAll({
      where: whereClause,
      attributes: [
        [literal("ROUND(rating)"), "star"],
        [fn("COUNT", col("review_id")), "count"],
      ],
      group: [literal("ROUND(rating)")],
      raw: true,
    });

    const starDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    starCounts.forEach((s) => {
      const star = Math.round(s.star);
      if (star >= 1 && star <= 5) starDistribution[star] = parseInt(s.count);
    });

    // Sub-ratings weighted average from View
    const reviewsData = await sequelize.query(
      "SELECT * FROM avg_prod_rating_view WHERE product_id IN (:productIds)",
      {
        replacements: { productIds },
        type: QueryTypes.SELECT,
      }
    );

    let summary = { total: 0, rating: 0, ease: 0, value: 0, features: 0, support: 0, recomm: 0 };
    if (reviewsData.length > 0) {
      let tw = 0;
      reviewsData.forEach((r) => {
        const c = parseInt(r.total_reviews) || 0;
        tw += c;
        summary.rating += (parseFloat(r.rating_average) || 0) * c;
        summary.ease += (parseFloat(r.avg_ease_use_rating) || 0) * c;
        summary.value += (parseFloat(r.avg_value_money_rating) || 0) * c;
        summary.features += (parseFloat(r.avg_features_rating) || 0) * c;
        summary.support += (parseFloat(r.avg_support_rating) || 0) * c;
        summary.recomm += (parseFloat(r.avg_soft_recomm) || 0) * c;
      });
      if (tw > 0) {
        summary = {
          total: tw,
          rating: parseFloat((summary.rating / tw).toFixed(1)),
          ease: parseFloat((summary.ease / tw).toFixed(1)),
          value: parseFloat((summary.value / tw).toFixed(1)),
          features: parseFloat((summary.features / tw).toFixed(1)),
          support: parseFloat((summary.support / tw).toFixed(1)),
          recomm: parseFloat((summary.recomm / tw).toFixed(1)),
        };
      }
    }

    // 2. Fetch Additional Metadata (Company & Product List)
    const vendorDetail = await VendorDetail.findOne({
      where: { vendor_id },
      attributes: ["company"],
    });

    const productList = await Product.findAll({
      where: { product_id: { [Op.in]: productIds } },
      attributes: ["product_id", "product_name", "slug"],
    });

    // 3. Fetch Review List
    const orderMap = {
      latest_first: [["created_at", "DESC"]],
      oldest_first: [["created_at", "ASC"]],
      highest_rating: [["rating", "DESC"]],
      lowest_rating: [["rating", "ASC"]],
    };

    const { rows: reviews, count: total } = await Review.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ReviewReplies,
          where: { is_deleted: 0 },
          required: false,
          include: [
            {
              model: VendorAuth,
              attributes: [[literal("CONCAT(first_name, ' ', last_name)"), "profile_name"]],
              required: false,
            },
          ],
        },
        {
          model: Product,
          attributes: ["product_name", "slug"],
          where: productName ? { product_name: { [Op.like]: `%${productName}%` } } : undefined,
          required: !!productName,
          include: [
            {
              model: ProductImage,
              where: { default: 1 },
              attributes: ["image"],
              required: false,
            },
          ],
        },
      ],
      order: orderMap[sort_by] || orderMap.latest_first,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    return {
      reviews,
      total,
      company: vendorDetail?.company || "",
      product_list: productList,
      overall_stats: {
        starDistribution,
        averages: summary,
      },
    };
  } catch (error) {
    throw error;
  }
};

export const getProfileCompletionService = async (vendor_id) => {
  try {
    const matrix = await VendorParticularMatrix.findAll({
      where: { vendor_id, status: 1 },
      include: [
        {
          model: VendorParticular,
          attributes: ["name", "score"],
          required: true,
        },
        {
          model: Brand,
          attributes: ["brand_name", "image"],
          required: true, // Matching PHP 'JOIN'
        },
        {
          model: Product,
          attributes: ["product_name"],
          required: false, // Matching PHP 'LEFT'
        },
      ],
    });

    return matrix;
  } catch (error) {
    throw error;
  }
};

export const getAccountStatusService = async (vendor_id) => {
  try {
    const vendor = await Vendors.findOne({
      where: { id: vendor_id },
      attributes: ["is_temp", "vendor_mode"],
    });
    return vendor;
  } catch (error) {
    throw error;
  }
};

export const saveReviewReplyService = async (vendor_id, profile_id, data) => {
  try {
    const { review_id, reply_text, reply_id } = data;

    const replyData = {
      review_id,
      reply_text,
      replied_by: vendor_id,
      replied_by_profile_id: profile_id,
      source: "eseller_hub",
      status: 0, // Pending moderation
      is_deleted: 0,
      updated_at: new Date(),
    };

    if (reply_id) {
      // Update existing reply
      await ReviewReplies.update(replyData, {
        where: { id: reply_id, replied_by: vendor_id },
      });
      return { status: true, message: "Reply updated successfully", reply_id };
    } else {
      // Create new reply
      replyData.created_at = new Date();
      const newReply = await ReviewReplies.create(replyData);
      return { status: true, message: "Reply saved successfully", reply_id: newReply.id };
    }
  } catch (error) {
    throw error;
  }
};

export const getTrustedSellerService = async (vendor_id) => {
  try {
    const productIds = await getVendorProductIds(vendor_id);

    // 1. Fetch current status from vendor table
    const vendor = await Vendors.findOne({
      where: { id: vendor_id },
      attributes: ["trusted_seller", "show_current_plan_data"],
    });

    // 2. Reviews Data via avg_prod_rating_view Raw Query
    let summaryStats = { total_reviews: 0, avg_rating: 0 };
    if (productIds.length > 0) {
      const reviewsData = await sequelize.query(
        "SELECT total_reviews, rating_average FROM avg_prod_rating_view WHERE product_id IN (:productIds)",
        {
          replacements: { productIds },
          type: QueryTypes.SELECT,
        }
      );

      if (reviewsData.length > 0) {
        let totalWeight = 0;
        let weightedRating = 0;
        reviewsData.forEach((row) => {
          const count = parseInt(row.total_reviews) || 0;
          totalWeight += count;
          weightedRating += (parseFloat(row.rating_average) || 0) * count;
        });

        if (totalWeight > 0) {
          summaryStats = {
            total_reviews: totalWeight,
            avg_rating: weightedRating / totalWeight,
          };
        }
      }
    }

    // 3. Response Time (Aligned with PHP Source: VendorAnalytics + OMS PI Filtering)
    let whereAnalytics = { vendor_id };

    // Apply OMS PI Plan filtering if enabled (parity with Code B)
    if (vendor.show_current_plan_data === 1) {
      const activePlans = await sequelize.query(
        `
        SELECT opd.start_date, opd.end_date
        FROM oms_pi_details opd
        LEFT JOIN tbl_leads_plan tlp ON tlp.id = opd.lead_plan_id
        WHERE tlp.plan_type = 'credit'
          AND opd.vendor_id = :vendor_id
          AND (CURDATE() BETWEEN opd.start_date AND opd.end_date)
          AND opd.pi_status = 3
      `,
        {
          replacements: { vendor_id },
          type: QueryTypes.SELECT,
        }
      );

      if (activePlans.length > 0) {
        const planConditions = activePlans
          .map((p) => `(logic_date BETWEEN '${p.start_date}' AND '${p.end_date}')`)
          .join(" OR ");
        whereAnalytics[Op.and] = [literal(`(${planConditions})`)];
      }
    }

    const analytics = await VendorAnalytics.findOne({
      where: whereAnalytics,
      attributes: [
        [fn("SUM", col("total_attempt_time")), "total_time"],
        [fn("SUM", col("total_attempt_lead")), "total_leads"],
      ],
      raw: true,
    });

    let avg_response_time = 0;
    if (analytics && analytics.total_leads > 0) {
      avg_response_time = Math.round(analytics.total_time / analytics.total_leads);
    } else {
      const realtime = await VendorsLeads.findAll({
        where: { vendor_id },
        attributes: [
          [
            fn(
              "AVG",
              literal(
                "TIMESTAMPDIFF(HOUR, VendorsLeads.created_at, (SELECT MIN(created_at) FROM vendor_agent_remark_reminder WHERE item_id = VendorsLeads.lead_id AND item_type = 3))"
              )
            ),
            "avg_response_time",
          ],
        ],
        raw: true,
      });
      avg_response_time = Math.round(realtime[0]?.avg_response_time || 0);
    }

    // 4. Price Availability
    const is_price_available =
      (await Product.count({
        where: {
          product_id: { [Op.in]: productIds },
          price_on_request: 1,
        },
      })) === 0
        ? 1
        : 0;

    return {
      is_trusted_seller: vendor?.trusted_seller || 0,
      avg_response_time,
      is_price_available,
      total_reviews: summaryStats.total_reviews,
      average_rating: parseFloat(summaryStats.avg_rating.toFixed(1)),
    };
  } catch (error) {
    throw error;
  }
};

export const sendReviewEmailService = async (vendor_id, data) => {
  try {
    const { to_emails, product_name, product_slug, subject } = data;

    if (!to_emails || to_emails.length === 0) {
      throw new AppError("No recipient emails provided", 400);
    }

    // 1. Fetch vendor company name for personalization
    const vendorDetail = await VendorDetail.findOne({
      where: { vendor_id },
      attributes: ["company"],
    });

    const companyName = vendorDetail?.company || "Team Techjockey";

    // 2. Prepare Email Queue records
    const emailQueueRecords = to_emails.map((email) => {
      const htmlBody = `
        <div style="font-family: 'Poppins', sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background-color: #384754; padding: 20px; text-align: center;">
              <img src="https://www.techjockey.com/assets/images/logo.png" alt="Techjockey" style="max-width: 150px;">
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #333;">Hi,</p>
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Thanks for choosing us for <strong>${product_name}</strong>. We appreciate your trust in us and value your support.
              </p>
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Potential customers use reviews from people like you to decide if we have what they need, and we’d like your help.
              </p>
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                If you have a moment to spare, please click on the button below to tell us if <strong>${product_name}</strong> was everything you were looking for!
              </p>
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Your feedback allows us to provide you with the best service possible.
              </p>
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://www.techjockey.com/add_review/${product_slug}" 
                   style="background-color: #1973e7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 500; display: inline-block;">
                  Write a Review
                </a>
              </div>
              <p style="font-size: 16px; color: #333; margin-top: 30px;">
                Thank you so much!<br>
                <strong>${companyName}</strong>
              </p>
            </div>
            <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
              For more software solutions visit <a href="https://www.techjockey.com" style="color: #1973e7;">www.techjockey.com</a>
            </div>
          </div>
        </div>
      `;

      return {
        from_email: "noreply@techjockey.com",
        to: email.trim(),
        subject: subject || `Write a Review For ${product_name}`,
        body: htmlBody,
        type: "write_review",
        app: "eseller",
        priority: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };
    });

    // 3. Batch Insert
    await EmailQueue.bulkCreate(emailQueueRecords);

    return { status: true, message: `Review requests queued for ${to_emails.length} recipients.` };
  } catch (error) {
    throw error;
  }
};
