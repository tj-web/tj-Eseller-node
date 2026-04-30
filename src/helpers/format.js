export const thousandsCurrencyFormat = (num) => {
  if (!num) return "0";
  return Number(num).toLocaleString("en-IN");
};

export const formatTime = (minutes) => {
  if (!minutes) return "0m";
  return minutes > 59 ? `${minutes.toFixed(2)}h` : `${minutes}m`;
};

export const toTitleCase = (str) =>
  str.replace(/(?:^|_)(\w)/g, (_, ch) => " " + ch.toUpperCase()).trim();

export const mergeArray = (input) =>
  Object.entries(input).reduce((acc, [key, value]) => {
    return value !== null && typeof value === "object" && !Array.isArray(value)
      ? { ...acc, ...mergeArray(value) }
      : { ...acc, [key]: value };
  }, {});
