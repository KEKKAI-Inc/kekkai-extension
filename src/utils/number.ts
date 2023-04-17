export function toFixed(num: number, count: number) {
  return Math.round(num * (10 ** count)) / (10 ** count);
}