export function currencyExchange(baseRate: number, symbolRate: number): number {
  return Math.round((symbolRate / baseRate) * 1000000) / 1000000;
}

export function diffDays(startDate: string, endDate: string): number {
  const date1 = new Date(startDate);
  const date2 = new Date(endDate);
  const diffTime = Math.abs(date2.valueOf() - date1.valueOf());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function addDays(date: Date, days: number): string {
  const result = new Date(date.valueOf());
  result.setDate(result.getDate() + days);
  return formatDate(result, "yyyy-MM-dd");
}

function formatDate(date: Date, format: string): string {
  format = format.replace(/yyyy/g, date.getFullYear().toString());
  format = format.replace(
    /MM/g,
    (date.getMonth() + 1).toString().padStart(2, "0")
  );
  format = format.replace(/dd/g, date.getDate().toString().padStart(2, "0"));
  format = format.replace(/HH/g, date.getHours().toString().padStart(2, "0"));
  format = format.replace(
    /mm/g,
    date.getMinutes().toString().padStart(2, "0")
  );
  format = format.replace(
    /ss/g,
    date.getSeconds().toString().padStart(2, "0")
  );
  format = format.replace(
    /SSS/g,
    date.getMilliseconds().toString().padStart(3, "0")
  );
  return format;
}