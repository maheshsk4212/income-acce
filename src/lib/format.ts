export function fmt(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function fmtK(n: number): string {
  return Math.abs(n) >= 1000 ? "$" + (n / 1000).toFixed(1).replace(/\.0$/, "") + "K" : fmt(n);
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
}
