export const analyticsConfig = {
  impression: {
    type: "bar",
    heading: "Total Impressions",
    hasData: true,
    info: "Number of ad impressions",
    icon: "📊",
  },
  pageviews: {
    type: "line",
    heading: "Page Views",
    hasData: true,
    info: "Number of page views",
    icon: "📈",
  },
  requests: {
    type: "box",
    heading: "Total Requests",
    hasData: true,
    info: "User requests count",
    icon: "📩",
  },
  avg_attemp_time: {
    type: "time",
    heading: "Avg Attempt Time",
    hasData: true,
    info: "Average time spent",
    icon: "⏱️",
  },
  total_utilisation: {
    type: "gauge",
    heading: "Utilisation",
    hasData: true,
    info: "Overall usage percent",
    icon: "⚙️",
  },
};
