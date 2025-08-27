export const thousandsCurrencyFormat = (num) => {
  if (!num) return "0";
  return Number(num).toLocaleString("en-IN");
};

export const formatTime = (minutes) => {
  if (!minutes) return "0m";
  return minutes > 59 ? `${(minutes).toFixed(2)}h` : `${minutes}m`;
};

