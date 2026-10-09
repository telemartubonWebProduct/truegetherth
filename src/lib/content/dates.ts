// Packages can be set to show from a day and until a day. Those days are
// Thailand's: the business and its customers are there, whatever the clock of
// the server or of an Admin's computer says.

/** Today's date in Thailand, such as "2026-10-31". */
export function todayInThailand(now: Date = new Date()): string {
  // en-CA writes dates as year-month-day.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
