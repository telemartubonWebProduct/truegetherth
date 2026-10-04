// CSV for the request download (src/app/admin/(console)/leads/export).

/** One CSV cell; a leading = + - @ is neutralised so spreadsheets do not run it as a formula. */
export function csvCell(value: string | null | undefined): string {
  let text = value ?? "";
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
