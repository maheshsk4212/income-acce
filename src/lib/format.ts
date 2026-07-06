export function fmt(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function fmtK(n: number): string {
  return Math.abs(n) >= 1000 ? "$" + (n / 1000).toFixed(1).replace(/\.0$/, "") + "K" : fmt(n);
}
