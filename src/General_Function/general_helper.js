export function objectKeyDiff(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = new Set(Object.keys(obj2));

  return keys1.filter(key => !keys2.has(key));
}

export function getCurrentDateTime() {
  const now = new Date();
 
  const year = now.getFullYear();
 
  // Month is zero-based in JS, so add 1 and pad with leading zero if needed
  const month = String(now.getMonth() + 1).padStart(2, '0');
 
  const day = String(now.getDate()).padStart(2, '0');
 
  const hours = String(now.getHours()).padStart(2, '0');
 
  const minutes = String(now.getMinutes()).padStart(2, '0');
 
  const seconds = String(now.getSeconds()).padStart(2, '0');
 
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
 
console.log(getCurrentDateTime());