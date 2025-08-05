export const prepareOemPlansData = (plansData) => {
  const temp = {};
  const sort = { plan_status: [], credits_used: [] };

  plansData.forEach((plan, key) => {
    const order_id = plan.id;

    const product = {
      product_id: plan.product_id || null,
      product_name: plan.product_name || null,
    };

    if (temp[order_id]) {
      if (product.product_id) temp[order_id].products.push(product);
    } else {
      const planObj = {
        ...plan,
        products: product.product_id ? [product] : [],
        plan_status:
          plan.end_date >= new Date().toISOString().split('T')[0] &&
          plan.credits_used <= plan.total_credits
            ? 1
            : 0,
        start_end_date: `${formatDate(plan.start_date)} - ${formatDate(
          plan.end_date
        )}`,
      };

      delete planObj.product_id;
      delete planObj.product_name;

      if (plan.show_credits == 0) {
        planObj.plan_type = 'branding';
      }

      if (planObj.plan_type === 'branding') {
        const today = new Date();
        const start = new Date(plan.start_date);
        const end = new Date(plan.end_date);

        planObj.total_days = dayDiff(start, end) + 1;
        planObj.days_availabe = end > today ? dayDiff(today, end) + 1 : 0;
        planObj.days_used = today > start ? dayDiff(start, today) : 0;

        planObj.left_heading = 'Total Days';
        planObj.right_top_heading = 'Days Passed';
        planObj.right_bottom_heading = 'Days Left';
      } else {
        planObj.left_heading = 'Total Credits';
        planObj.right_top_heading = 'Credits Consumed';
        planObj.right_bottom_heading = 'Credits Available';
      }

      if (planObj.plan_status === 1) {
        planObj.heading = 'Your active plan';
        planObj.heading_color = '#2F5B59';
        planObj.body_color = '#BFECE2';
      } else {
        planObj.heading = 'Expired plan';
        planObj.heading_color = '#C0273E';
        planObj.body_color = '#EFD2D8';
      }

      temp[order_id] = planObj;
      sort.plan_status[key] = planObj.plan_status;
      sort.credits_used[key] = planObj.credits_used;
    }
  });

  const sorted = Object.values(temp).sort((a, b) => {
    if (b.plan_status === a.plan_status) {
      return b.credits_used - a.credits_used;
    }
    return b.plan_status - a.plan_status;
  });

  return sorted;
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
};

const dayDiff = (date1, date2) => {
  return Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));
};
