export const showAnalytics = true;

export const analytics = {
  impression: {
    type: "impression",
    hasData: true,
    heading: "Impressions",
    info: "Number of times your products are shown. An impression is counted each time your product or banner is visible on website.",
    icon: "/static/images/analytics_icon/app/impression.png", // adjust path
  },
  pageviews: {
    type: "pageviews",
    hasData: false,
    heading: "Page Views",
    info: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s",
    icon: "/static/images/analytics_icon/app/pageviews.png",
  },
  requests: {
    type: "requests",
    hasData: true,
    heading: "Total Requests",
    info: "Number of potential users who requested phone call or demo for your products.",
    icon: "/static/images/analytics_icon/app/requests.png",
  },
  avg_attemp_time: {
    type: "avg_attemp_time",
    hasData: true,
    heading: "Average Attempt Time",
    info: "Average time taken by you to connect with potential customer.",
    icon: "/static/images/analytics_icon/app/avg_attemp_time.png",
  },
  total_utilisation: {
    type: "total_utilisation",
    hasData: true,
    heading: "Total Utilisation",
    info: "% of requests utilized by you. It includes phone call and viewing contact information of a potential customer.",
    icon: "/static/images/analytics_icon/app/total_utilisation.png",
  },
};
